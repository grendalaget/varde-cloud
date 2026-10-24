import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { federationSecret, mintDesktopToken } from "@/lib/federation";
import { CP_BASE_URL } from "@/lib/cp";
import { safeNext } from "@/lib/next";

// Bounce point between the site and the hosted control plane: requires a
// site session, mints a federation token, and 302s to the CP dashboard with
// the token in the URL fragment (fragments never reach server logs or
// referers). The CP SPA reads location.hash and exchanges it at
// /v1/auth/external for a real CP session.
//
// Combined with the domain-wide session cookie (crossSubDomainCookies in
// lib/auth.ts) this is the zero-login path: a user already signed in on
// varde.games gets bounced here by the dashboard and lands signed in on
// cp.varde.games.
export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  // Only same-site paths are honored — anything else would be an open
  // redirect helper.
  const next = safeNext(reqUrl.searchParams.get("next")) ?? "/";
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    // Signed-out visits land on sign-in and come back here afterwards.
    const back = `/federate/cp?next=${encodeURIComponent(next)}`;
    return Response.redirect(
      new URL(`/auth/sign-in?next=${encodeURIComponent(back)}`, reqUrl.origin),
    );
  }
  const secret = federationSecret();
  if (!secret) {
    return Response.json(
      { error: "Federation is not enabled" },
      { status: 503 },
    );
  }
  const token = await mintDesktopToken(session.user, secret);
  const target = new URL(next, CP_BASE_URL);
  // Belt on top of safeNext: the redirect (and its token) must stay on the CP.
  if (target.origin !== new URL(CP_BASE_URL).origin) {
    return Response.json({ error: "Invalid next path" }, { status: 400 });
  }
  target.hash = `fed_token=${token}`;
  return Response.redirect(target.toString(), 302);
}
