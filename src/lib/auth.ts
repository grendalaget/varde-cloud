import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "./db";
import * as schema from "../db/schema";

/**
 * varde.games authentication.
 *
 * Email+password today. OAuth providers (GitHub, Google) plug in via
 * `socialProviders` once their app credentials exist — the Drizzle `account`
 * table already stores their tokens. In-game Varde accounts live in the
 * control plane (its own argon2id auth) for now; see README for the
 * unification plan (the CP's `auth.Provider` seam allows OIDC later).
 */
export const auth = betterAuth({
  appName: "Varde",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
  plugins: [nextCookies()],
});
