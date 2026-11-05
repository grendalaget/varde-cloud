import type { BetterAuthOptions } from "better-auth";

export function authCookieOptions(baseURL: string) {
  const secure = new URL(baseURL).protocol === "https:";
  return {
    // Better Auth 1.7 adds __Secure- automatically when this is true. Supply
    // the actual __Host- prefix and Secure attribute separately instead.
    useSecureCookies: false,
    cookiePrefix: secure ? "__Host-varde" : "varde",
    crossSubDomainCookies: { enabled: false },
    defaultCookieAttributes: {
      secure,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    },
  } satisfies NonNullable<BetterAuthOptions["advanced"]>;
}
