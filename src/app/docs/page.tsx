import Link from "next/link";
import type { Metadata } from "next";

import { DOCS_SECTIONS } from "@/lib/docs-nav";
import { DocTitle } from "@/components/docs-primitives";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Varde guides for players and hosts. Install, link, host, and troubleshoot, explained for humans.",
};

export default function DocsIndex() {
  return (
    <>
      <DocTitle
        title="Varde docs"
        intro="Everything here is written for people, not infrastructure engineers. Pick a guide and follow it end to end."
      />
      <div className="space-y-10">
        {DOCS_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
              {section.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/docs/${page.slug}`}
                  className="group rounded-large border border-separator bg-surface-100 p-4 transition-colors hover:border-surface-400 hover:bg-surface-200"
                >
                  <p className="font-semibold text-foreground group-hover:text-glod">
                    {page.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">{page.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
