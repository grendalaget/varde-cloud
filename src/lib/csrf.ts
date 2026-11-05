import { authBaseURL } from "./auth-origins.ts";

const originExemptions = new Set([
  // Polar verifies the raw webhook body's signature before any billing update.
  "POST /api/auth/polar/webhooks",
]);

export function sameOriginRequest(
  request: Request,
  siteURL = authBaseURL(),
): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const url = new URL(request.url);
  if (originExemptions.has(`${request.method} ${url.pathname}`)) return true;
  const origin = request.headers.get("Origin");
  if (origin !== null) return origin === new URL(siteURL).origin;
  const site = request.headers.get("Sec-Fetch-Site");
  return site === "same-origin" || site === "none";
}

export function withSameOrigin<Args extends unknown[]>(
  handler: (request: Request, ...args: Args) => Response | Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    if (!sameOriginRequest(request)) {
      return Response.json({ error: "forbidden", message: "Cross-origin request rejected" }, { status: 403 });
    }
    return handler(request, ...args);
  };
}
