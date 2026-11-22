export const PH_COOKIE = "varde_producthunt";
export const PH_DISMISSED = "varde_ph_dismissed";

export function isProductHuntVisit(params: URLSearchParams): boolean {
  return [params.get("ref"), params.get("utm_source")].some((value) => value?.trim().toLowerCase() === "producthunt");
}

export function shouldShowProductHunt(search: string, cookie: string, dismissed: string | null): boolean {
  if (dismissed === "1") return false;
  return isProductHuntVisit(new URLSearchParams(search)) || cookie.split(";").some((part) => part.trim() === `${PH_COOKIE}=1`);
}
