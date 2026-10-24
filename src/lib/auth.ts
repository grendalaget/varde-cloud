import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  polar as polarPlugin,
  checkout,
  portal,
  webhooks,
} from "@polar-sh/better-auth";
import { eq } from "drizzle-orm";

import { db } from "./db";
import * as schema from "../db/schema";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { polar, polarCore, POLAR_PRODUCTS, planForProduct } from "./polar";

// Recompute the user's `plan` from Polar's live customer state. Webhook
// payloads are snapshots that can arrive out of order (Polar retries failed
// deliveries), and a customer may hold several subscriptions, so the event
// is only a trigger. Polar customers carry external_id = user.id; a throw
// here fails the webhook and Polar retries it.
async function syncPlan(userId: string | null | undefined) {
  if (!userId || !polar) return;
  const state = await polar.customers.getStateExternal(userId);
  const plans = state.active_subscriptions.map((s) => planForProduct(s.product_id));
  const plan = plans.includes("anchor+")
    ? "anchor+"
    : plans.includes("anchor")
      ? "anchor"
      : "free";
  await db.update(schema.user).set({ plan }).where(eq(schema.user.id, userId));
}

// Per-account mail guard: unauthenticated callers can mint mail tokens at
// will (reset links, verification links via sign-in attempts and the resend
// endpoint), so cap how often we actually send. In-memory is a best-effort
// limit (per warm instance); Resend-side rate rules are the durable backstop.
const MAIL_COOLDOWN_MS = 5 * 60 * 1000;
const mailSentAt = new Map<string, number>();
const mailInFlight = new Map<string, Promise<void>>();

// Skips sends inside the cooldown window and coalesces concurrent requests
// onto the in-flight send, so every caller observes that send's real
// outcome — never a suppressed request reported as success. A failed send
// stamps no cooldown, so the next request retries.
async function sendWithCooldown(key: string, send: () => Promise<void>) {
  const last = mailSentAt.get(key);
  if (last !== undefined && Date.now() - last < MAIL_COOLDOWN_MS) return;
  const inFlight = mailInFlight.get(key);
  if (inFlight) return inFlight;
  const p = (async () => {
    try {
      await send();
      mailSentAt.set(key, Date.now());
    } finally {
      mailInFlight.delete(key);
    }
  })();
  mailInFlight.set(key, p);
  return p;
}

const polarPlugins = polarCore
  ? [
      polarPlugin({
        client: polarCore,
        // Never block sign-up on Polar: a Polar API failure (bad env pair,
        // email-domain validation, outage) aborted account creation. Checkout
        // and portal pass external_customer_id, so Polar materializes the
        // customer lazily on first billing action instead.
        createCustomerOnSignUp: false,
        use: [
          checkout({
            products: POLAR_PRODUCTS,
            successUrl: "/account?checkout_id={CHECKOUT_ID}",
            authenticatedUsersOnly: true,
          }),
          portal(),
          webhooks({
            secret: process.env.POLAR_WEBHOOK_SECRET ?? "",
            onSubscriptionCreated: (payload) => syncPlan(payload.data.customer.external_id),
            onSubscriptionActive: (payload) => syncPlan(payload.data.customer.external_id),
            onSubscriptionUpdated: (payload) => syncPlan(payload.data.customer.external_id),
            onSubscriptionCanceled: (payload) => syncPlan(payload.data.customer.external_id),
            onSubscriptionRevoked: (payload) => syncPlan(payload.data.customer.external_id),
          }),
        ],
      }),
    ]
  : [];

/**
 * varde.games authentication.
 *
 * Email+password today. OAuth providers (GitHub, Google) plug in via
 * `socialProviders` once their app credentials exist; the Drizzle `account`
 * table already stores their tokens. In-game Varde accounts live in the
 * control plane (its own argon2id auth) for now; see README for the
 * unification plan (the CP's `auth.Provider` seam allows OIDC later).
 *
 * Billing (Polar) is wired but dormant until POLAR_ACCESS_TOKEN + product
 * IDs are set; see src/lib/polar.ts.
 */
// Explicit BETTER_AUTH_URL wins. In production fall back to the canonical
// domain — VERCEL_URL is the *.vercel.app deployment URL, which must never
// end up in emailed verify/reset links. Previews fall back to their own
// deployment URL so auth works on temp domains; dev falls back to local.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_ENV === "production"
    ? "https://varde.games"
    : process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

// Domain-wide session cookies let cp.varde.games recognize a varde.games
// sign-in with no second login. Only on the real domain — previews and local
// dev keep host-scoped cookies. A Vercel preview can point BETTER_AUTH_URL at
// prod while serving *.vercel.app; a .varde.games cookie there is rejected by
// browsers, which would break preview sign-ins, so the env must be prod too.
const baseHost = new URL(baseURL).hostname;
const shareAcrossSubdomains =
  (process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV) &&
  (baseHost === "varde.games" || baseHost.endsWith(".varde.games"));

export const auth = betterAuth({
  appName: "Varde",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  // Origins allowed to POST to the auth endpoints and to receive auth
  // redirects. The baseURL origin is implied; cover the custom domain, its
  // www variant, local dev, and this preview deployment's own URLs (where
  // BETTER_AUTH_URL may point at prod). Never a *.vercel.app wildcard:
  // anyone can host there, and a reset link redirects to its callbackURL
  // with the reset token attached.
  trustedOrigins: [
    "https://varde.games",
    "https://www.varde.games",
    "http://localhost:3000",
    ...[process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
      .filter(Boolean)
      .map((host) => `https://${host}`),
  ],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendWithCooldown(`verify:${user.email}`, () =>
        sendVerificationEmail(user.email, url),
      );
    },
    // Verification mail goes out on sign-up and again whenever an unverified
    // user tries to sign in — that retry is how pre-verification users
    // recover access (see requireEmailVerification below).
    sendOnSignUp: true,
    sendOnSignIn: true,
    // The verify link drops the user straight into a session, so the
    // post-click redirect can land on a signed-in page.
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Unverified users cannot sign in: sign-in attempts return
    // EMAIL_NOT_VERIFIED (and, per sendOnSignIn, send a fresh link). Also
    // makes sign-up skip its session and answer duplicate emails with a
    // generic response instead of USER_ALREADY_EXISTS.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendWithCooldown(`reset:${user.email}`, () =>
        sendPasswordResetEmail(user.email, url),
      );
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: shareAcrossSubdomains,
      domain: "varde.games",
    },
  },
  user: {
    additionalFields: {
      // Subscription tier, synced from Polar webhooks: free | anchor | anchor+
      plan: { type: "string", defaultValue: "free", input: false },
    },
  },
  socialProviders: {
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // },
  },
  plugins: [nextCookies(), ...polarPlugins],
});

