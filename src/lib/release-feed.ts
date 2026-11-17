export const REPO = "grendalaget/varde";
const RELEASES = `https://github.com/${REPO}/releases`;
export const FEEDS = [
  { channel: "stable", url: `${RELEASES}/latest/download/latest.json` },
  { channel: "nightly", url: `${RELEASES}/download/nightly/latest.json` },
] as const;

export type Channel = (typeof FEEDS)[number]["channel"];

/** Download targets, keyed by the update feed's platform names. */
export const TARGETS = {
  windows: { platform: "windows-x86_64", label: "Windows installer" },
  "macos-arm64": { platform: "darwin-aarch64-app", label: "macOS (Apple silicon)" },
  "macos-x64": { platform: "darwin-x86_64-app", label: "macOS (Intel)" },
  "linux-deb": { platform: "linux-x86_64-agent-deb", label: "Linux .deb (x86_64)" },
  "linux-rpm": { platform: "linux-x86_64-agent-rpm", label: "Linux .rpm (x86_64)" },
  "linux-arm64-deb": { platform: "linux-aarch64-agent-deb", label: "Linux .deb (arm64)" },
} as const;

export type Target = keyof typeof TARGETS;

export type Release = {
  channel: Channel;
  version: string;
  publishedAt: string | null;
  // "signed" only when the nightly marker says Windows code signing ran
  windowsSigning: "signed" | "unsigned" | "unknown";
  pageUrl: string;
  urls: Partial<Record<Target, string>>;
};

export type Feed = {
  version?: string;
  pub_date?: string;
  platforms?: Record<string, { url?: string }>;
};


export function releaseFromFeed(
  channel: Channel,
  data: Feed | null,
): Omit<Release, "windowsSigning"> | null {
  const platforms = data?.platforms;
  if (!data?.version || !platforms?.[TARGETS.windows.platform]?.url) return null;
  const urls: Release["urls"] = {};
  for (const [target, { platform }] of Object.entries(TARGETS)) {
    const url = platforms[platform]?.url;
    if (url?.startsWith(`https://github.com/${REPO}/releases/download/`))
      urls[target as Target] = url;
  }
  return {
    channel,
    version: data.version,
    publishedAt: data.pub_date ?? null,
    pageUrl: channel === "nightly" ? `${RELEASES}/tag/nightly` : `${RELEASES}/latest`,
    urls,
  };
}

/** Windows signing as recorded by the nightly workflow's release marker. */
export function signingFromBody(body: string | undefined): Release["windowsSigning"] {
  const marker = body?.match(/<!-- nightly-signing:([\w-]+) -->/)?.[1];
  if (!marker) return "unknown";
  return marker.startsWith("azure") ? "signed" : "unsigned";
}

export const RELEASES_URL = RELEASES;
