export const ATTRIBUTION_COOKIE = "varde_attribution";
export const ATTRIBUTION_MAX_AGE = 30 * 24 * 60 * 60;

export function landingAttribution(params: URLSearchParams): Record<string, string> | null {
  const values: Record<string, string> = {};
  for (const [key, value] of params) {
    if ((key === "ref" || /^utm_[a-z_]{1,40}$/.test(key)) && value.trim()) {
      if (Object.keys(values).length >= 12) break;
      const candidate = { ...values, [key]: values[key] ?? value.trim().slice(0, 120).toWellFormed() };
      if (encodeURIComponent(JSON.stringify(candidate)).length <= 3000) {
        values[key] ??= candidate[key];
      }
    }
  }
  return Object.keys(values).length ? values : null;
}

export function attributionFromCookie(cookie: string | null | undefined): string | null {
  try {
    const raw = cookie?.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${ATTRIBUTION_COOKIE}=`))?.slice(ATTRIBUTION_COOKIE.length + 1);
    if (!raw || raw.length > 4000) return null;
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") params.set(key, value);
    }
    const values = landingAttribution(params);
    return values ? JSON.stringify(values) : null;
  } catch {
    return null;
  }
}
