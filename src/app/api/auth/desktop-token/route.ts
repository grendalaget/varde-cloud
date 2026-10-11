import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { federationSecret, mintDesktopToken } from "@/lib/federation";

// Mints the short-lived token the desktop exchanges at the control plane.
// Kept behind POST so the bearer never lands in a cached page response or
// access log — the client calls it right before handing off to varde://.
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  const secret = federationSecret();
  if (!secret) {
    return Response.json(
      { error: "Desktop sign-in is not enabled" },
      { status: 503 },
    );
  }
  const token = await mintDesktopToken(session.user, secret);
  return Response.json({
    url: `varde://auth/callback?token=${token}`,
  });
}
