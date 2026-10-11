// Only same-site paths are valid post-auth redirects — never an absolute
// URL or protocol-relative one (open-redirect guard).
export function safeNext(next: string | undefined): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return undefined;
  return next;
}
