import { NextResponse, type NextRequest } from "next/server";

import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, landingAttribution } from "./lib/attribution";
import { isProductHuntVisit, PH_COOKIE } from "./lib/product-hunt";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (isProductHuntVisit(request.nextUrl.searchParams) && !request.cookies.has(PH_COOKIE)) {
    response.cookies.set(PH_COOKIE, "1", {
      maxAge: ATTRIBUTION_MAX_AGE,
      httpOnly: false,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
    });
  }
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
