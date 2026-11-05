export function authBaseURL(environment: Record<string, string | undefined> = process.env): string {
  // Production links use the canonical domain, not Vercel's deployment URL.
  return environment.BETTER_AUTH_URL ??
    (environment.VERCEL_ENV === "production"
      ? "https://varde.games"
      : environment.VERCEL_ENV === "preview" && environment.VERCEL_URL
        ? `https://${environment.VERCEL_URL}`
        : "http://localhost:3000");
}

export function authOriginOptions(environment: Record<string, string | undefined> = process.env) {
  const baseURL = authBaseURL(environment);
  // Only these exact origins can receive auth redirects or make API mutations.
  const trustedOrigins = [...new Set([
    new URL(baseURL).origin,
    "https://varde.games",
    "https://www.varde.games",
    "http://localhost:3000",
    ...[environment.VERCEL_URL, environment.VERCEL_BRANCH_URL]
      .filter(Boolean)
      .map((host) => new URL(`https://${host}`).origin),
  ])];
  return { baseURL, trustedOrigins };
}
