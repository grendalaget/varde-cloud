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
import { sendPasswordResetEmail } from "./email";
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

const RESET_MAIL_COOLDOWN_MS = 5 * 60 * 1000;
const resetMailSentAt = new Map<string, number>();

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
  // Explicit BETTER_AUTH_URL wins (production). On Vercel previews, fall back
  // to the deployment's own URL so auth works on temp/preview domains; local
  // dev falls back to localhost.
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL
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
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // Per-account mail cooldown: unauthenticated callers can mint reset
      // tokens at will, so cap how often we actually send. In-memory is a
      // best-effort limit (per warm instance); Resend-side rate rules are
      // the durable backstop.
      const last = resetMailSentAt.get(user.email);
      if (last && Date.now() - last < RESET_MAIL_COOLDOWN_MS) return;
      resetMailSentAt.set(user.email, Date.now());
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

