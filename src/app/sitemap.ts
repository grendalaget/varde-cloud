import type { MetadataRoute } from "next";

import { ALL_DOCS_PAGES } from "@/lib/docs-nav";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.varde.games";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/download`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/docs`, changeFrequency: "weekly", priority: 0.7 },
    ...ALL_DOCS_PAGES.map((p) => ({
      url: `${base}/docs/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
