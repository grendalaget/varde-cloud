import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { federationSecret, mintDesktopToken } from "@/lib/federation";

// Mints the short-lived token the desktop exchanges at the control plane.
// Session-gated on both methods; the bearer never lands in page markup or
// GET logs (it only appears in a redirect Location or a POST response).
async function desktopToken(
  unauthenticated: () => Response,
): Promise<string | Response> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return unauthenticated();
  }
  const secret = federationSecret();
  if (!secret) {
    return Response.json(
      { error: "Desktop sign-in is not enabled" },
      { status: 503 },
    );
  }
  return mintDesktopToken(session.user, secret);
}

// The "Open Varde" click navigates here synchronously — keeping its user
// activation so the browser's app-launch prompt can't be lost to a slow
// token request — and the 302 hands off to the OS protocol handler.
export async function GET(req: Request) {
  // A signed-out/expired click lands back on sign-in (which returns here),
  // not on a JSON error page with no path forward. Response.redirect needs
  // an absolute URL.
  const r = await desktopToken(() =>
    Response.redirect(new URL("/auth/sign-in?next=/auth/desktop", req.url)),
  );
  return typeof r === "string"
    ? Response.redirect(`varde://auth/callback?token=${r}`)
    : r;
}

// JSON variant for the auto-open attempt on page load: the client hands the
// returned URL to window.location itself so it can offer a retry on error.
export async function POST() {
  const r = await desktopToken(() =>
    Response.json({ error: "Sign in first" }, { status: 401 }),
  );
  return typeof r === "string"
    ? Response.json({ url: `varde://auth/callback?token=${r}` })
    : r;
}
