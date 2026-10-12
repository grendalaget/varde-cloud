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
import { polarCore, POLAR_PRODUCTS, planForProduct } from "./polar";

// Sync a Polar subscription's product/status onto our user's `plan` field.
// Polar customers carry external_id = user.id (set by createCustomerOnSignUp),
// and the webhook payload already embeds the customer object.
async function syncPlan(userId: string | null | undefined, active: boolean, productId?: string) {
  if (!userId) return;
  await db
    .update(schema.user)
    .set({ plan: active && productId ? planForProduct(productId) : "free" })
    .where(eq(schema.user.id, userId));
}

// Per-account mail cooldown: unauthenticated callers can mint mail tokens at
// will (reset links, verification links via sign-in attempts and the resend
// endpoint), so cap how often we actually send. In-memory is a best-effort
// limit (per warm instance); Resend-side rate rules are the durable backstop.
const MAIL_COOLDOWN_MS = 5 * 60 * 1000;
const mailSentAt = new Map<string, number>();

function mailCooldownActive(key: string) {
  const last = mailSentAt.get(key);
  if (last && Date.now() - last < MAIL_COOLDOWN_MS) return true;
  mailSentAt.set(key, Date.now());
  return false;
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
            onSubscriptionCreated: (payload) =>
              syncPlan(payload.data.customer.external_id, true, payload.data.product_id),
            onSubscriptionActive: (payload) =>
              syncPlan(payload.data.customer.external_id, true, payload.data.product_id),
            onSubscriptionUpdated: (payload) =>
              syncPlan(
                payload.data.customer.external_id,
                payload.data.status === "active" || payload.data.status === "trialing",
                payload.data.product_id,
              ),
            onSubscriptionCanceled: (payload) =>
              syncPlan(
                payload.data.customer.external_id,
                payload.data.status === "active" || payload.data.status === "trialing",
                payload.data.product_id,
              ),
            onSubscriptionRevoked: (payload) =>
              syncPlan(payload.data.customer.external_id, false),
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
export const auth = betterAuth({
  appName: "Varde",
  // Explicit BETTER_AUTH_URL wins. In production fall back to the canonical
  // domain — VERCEL_URL is the *.vercel.app deployment URL, which must never
  // end up in emailed verify/reset links. Previews fall back to their own
  // deployment URL so auth works on temp domains; dev falls back to local.
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_ENV === "production"
      ? "https://varde.games"
      : process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  secret: process.env.BETTER_AUTH_SECRET,
  // Origins allowed to POST to the auth endpoints. The baseURL origin is
  // implied; cover the custom domain, its www variant, local dev, and
  // Vercel preview deployments (where BETTER_AUTH_URL may point at prod).
  trustedOrigins: [
    "https://varde.games",
    "https://www.varde.games",
    "http://localhost:3000",
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    "https://*.vercel.app",
  ],
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (mailCooldownActive(`verify:${user.email}`)) return;
      await sendVerificationEmail(user.email, url);
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
      if (mailCooldownActive(`reset:${user.email}`)) return;
      await sendPasswordResetEmail(user.email, url);
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

