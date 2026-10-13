import { connection } from "next/server";
import { headers } from "next/headers";

import { auth } from "./auth";

/**
 * Session lookup for Server Components.
 *
 * `await connection()` pins the call to the request-time render pass. Under
 * Cache Components, `headers()` alone resolves in the earlier runtime stage
 * where the session lookup's libsql `fetch()` is still suspended — its
 * rejection is swallowed by better-auth's catch-all and comes back as `null`,
 * silently treating signed-in users as signed out.
 *
 * Route handlers are always request-time: call `auth.api.getSession` directly.
 */
export async function getServerSession() {
  await connection();
  return auth.api.getSession({ headers: await headers() });
}
