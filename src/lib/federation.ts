// Federation tokens for the Varde desktop app: the site mints a short-lived
// HS256 JWT; the hosted control plane (cp.varde.games) verifies it with the
// same secret and mints a normal CP session. The claims must match the CP's
// `auth.Federation` verifier — iss/aud are pinned on both sides.
import { SignJWT } from "jose";

export const FEDERATION_ISSUER = "https://varde.games";
export const FEDERATION_AUDIENCE = "cp.varde.games";
// Five minutes per the token contract; the CP allows a small clock-skew
// margin on top of this.
export const FEDERATION_LIFETIME_S = 300;

export function federationSecret(): Uint8Array | null {
  const secret = process.env.FEDERATION_SECRET;
  return secret ? new TextEncoder().encode(secret) : null;
}

export async function mintDesktopToken(
  user: { id: string; email?: string | null; name?: string | null },
  secret: Uint8Array,
): Promise<string> {
  return new SignJWT({
    email: user.email ?? "",
    name: user.name ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(FEDERATION_ISSUER)
    .setAudience(FEDERATION_AUDIENCE)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${FEDERATION_LIFETIME_S}s`)
    .sign(secret);
}
