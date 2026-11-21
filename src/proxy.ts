import { NextResponse, type NextRequest } from "next/server";

import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, landingAttribution } from "./lib/attribution";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.has(ATTRIBUTION_COOKIE)) {
    const attribution = landingAttribution(request.nextUrl.searchParams);
    if (attribution) {
      response.cookies.set(ATTRIBUTION_COOKIE, JSON.stringify(attribution), {
        maxAge: ATTRIBUTION_MAX_AGE,
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
      });
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|download/|.*\\.[^/]+$).*)"],
};
