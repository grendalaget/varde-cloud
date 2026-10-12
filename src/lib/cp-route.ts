// Shared plumbing for /api/cp/* route handlers: session gate + error
// mapping. Every handler is better-auth session-gated and talks to the
// hosted CP through withCp; nothing CP-side reaches the browser directly.
import { headers } from "next/headers";

import { auth } from "./auth";
import { CpError, CpUnavailable } from "./cp";

export type CpSession = Awaited<
  ReturnType<typeof auth.api.getSession>
> extends { user: infer U }
  ? U
  : never;

// Returns the signed-in user or the 401/503 Response to return.
export async function cpUser(): Promise<CpSession | Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }
  return session.user as CpSession;
}

export function isResponse(x: unknown): x is Response {
  return x instanceof Response;
}

export function cpErrorResponse(e: unknown): Response {
  if (e instanceof CpUnavailable) {
    return Response.json({ error: "unavailable", message: e.message }, { status: 503 });
  }
  if (e instanceof CpError) {
    return Response.json(
      { error: e.code, message: e.message },
      { status: e.status },
    );
  }
  throw e;
}
