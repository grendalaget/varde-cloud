import { connection } from "next/server";
import { headers } from "next/headers";
import { cache } from "react";

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
// Per-request memoized — the nav's two auth zones share one Turso lookup.
export const getServerSession = cache(async () => {
  await connection();
  return auth.api.getSession({ headers: await headers() });
});
