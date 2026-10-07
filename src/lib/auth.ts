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

const polarPlugins = polarCore
  ? [
      polarPlugin({
        client: polarCore,
        createCustomerOnSignUp: true,
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
 * `socialProviders` once their app credentials exist — the Drizzle `account`
 * table already stores their tokens. In-game Varde accounts live in the
 * control plane (its own argon2id auth) for now; see README for the
 * unification plan (the CP's `auth.Provider` seam allows OIDC later).
 *
 * Billing (Polar) is wired but dormant until POLAR_ACCESS_TOKEN + product
 * IDs are set — see src/lib/polar.ts.
 */
export const auth = betterAuth({
  appName: "Varde",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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

