import type { Metadata } from "next";

import { DocsNav } from "@/components/docs-nav";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Varde guides for players and hosts. Install, link, host, and troubleshoot, explained for humans.",
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10">
        <DocsNav />
        <article className="min-w-0 max-w-3xl">{children}</article>
      </div>
    </div>
  );
}
