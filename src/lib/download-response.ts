import { RELEASES_URL, TARGETS, type Release, type Target } from "./release-feed.ts";

const UNCACHED = { "Cache-Control": "no-store" };

export async function downloadResponse(target: string, loadRelease: () => Promise<Pick<Release, "urls"> | null>): Promise<Response> {
  if (!Object.hasOwn(TARGETS, target)) return new Response("Unknown download", { status: 404, headers: UNCACHED });
  try {
    const release = await loadRelease();
    const url = release?.urls[target as Target];
    return new Response(null, {
      status: 302,
      headers: {
        Location: url ?? RELEASES_URL,
        "Cache-Control": url ? "public, max-age=0, s-maxage=60" : "no-store",
      },
    });
  } catch {
    return new Response("Download unavailable", { status: 503, headers: UNCACHED });
  }
}
