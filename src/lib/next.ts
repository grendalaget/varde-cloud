// Same-site `?next` target for auth redirects — anything that would leave
// the origin (https://, //host, /\backslash-host, etc.) falls back to
// undefined so callers can use their default destination.
export function safeNext(next: string | null | undefined): string | undefined {
  if (!next) return undefined;
  try {
    const u = new URL(next, "https://varde.invalid");
    if (u.origin !== "https://varde.invalid") return undefined;
  } catch {
    return undefined;
  }
  return next.startsWith("/") ? next : undefined;
}
