"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOCS_SECTIONS } from "@/lib/docs-nav";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Docs" className="space-y-6">
      {DOCS_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {section.title}
          </p>
          <ul className="space-y-1">
            {section.pages.map((page) => {
              const href = `/docs/${page.slug}`;
              const active = pathname === href;
              return (
                <li key={page.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-surface-300 font-medium text-foreground"
                        : "text-muted hover:bg-surface-200 hover:text-foreground"
                    }`}
                  >
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function DocsNav() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return (
    <>
      <aside className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pr-6 md:block">
        <NavList />
      </aside>
      <details
        ref={detailsRef}
        className="mb-6 rounded-2xl border border-separator bg-surface-100 p-4 md:hidden"
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
          Docs menu
        </summary>
        <div className="mt-4">
          <NavList
            onNavigate={() => detailsRef.current?.removeAttribute("open")}
          />
        </div>
      </details>
    </>
  );
}
