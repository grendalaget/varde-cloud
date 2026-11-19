import { cacheLife } from "next/cache";

import {
  FEEDS,
  REPO,
  releaseFromFeed,
  signingFromBody,
  type Feed,
  type Release,
} from "./release-feed";

export { RELEASES_URL, TARGETS, type Release, type Target } from "./release-feed";

async function json<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "varde.games" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function nightlySigning(): Promise<Release["windowsSigning"]> {
  const rel = await json<{ body?: string }>(
    `https://api.github.com/repos/${REPO}/releases/tags/nightly`,
  );
  return signingFromBody(rel?.body);
}

/** The newest release with a Windows installer: stable first, else nightly. */
export async function latestRelease(): Promise<Release | null> {
  "use cache";
  cacheLife("minutes");
  for (const feed of FEEDS) {
    const release = releaseFromFeed(
      feed.channel,
      await json<Feed>(feed.url),
    );
    if (!release) continue;
    return {
      ...release,
      windowsSigning:
        feed.channel === "nightly" ? await nightlySigning() : "unknown",
    };
  }
  return null;
}

