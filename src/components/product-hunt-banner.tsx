"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { PH_DISMISSED, shouldShowProductHunt } from "@/lib/product-hunt";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function getSnapshot() {
  let dismissed = null;
  try { dismissed = localStorage.getItem(PH_DISMISSED); } catch {
    return shouldShowProductHunt(window.location.search, document.cookie, null);
  }
  return shouldShowProductHunt(window.location.search, document.cookie, dismissed);
}

function getServerSnapshot() { return false; }

export function ProductHuntBanner() {
  usePathname();
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const offer = process.env.NEXT_PUBLIC_PH_OFFER?.trim();
  if (!visible || dismissed) return null;

  return (
    <div className="pointer-events-none absolute inset-x-3 top-1 z-20">
      <aside aria-label="Product Hunt welcome" className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-2 rounded-xl border border-glod/40 bg-surface px-3 py-1 text-xs leading-4 shadow-xl">
        <div className={`flex min-w-0 flex-1 items-baseline gap-2${expanded ? " flex-wrap" : ""}`}>
          <p className="shrink-0 whitespace-nowrap font-medium text-foreground">Welcome, Product Hunt visitors.</p>
          {offer ? (
            <button
              type="button"
              aria-expanded={expanded}
              className={`min-w-0 text-left text-muted focus-visible:outline-2 focus-visible:outline-glod ${expanded ? "basis-full break-words whitespace-normal" : "truncate"}`}
              onClick={() => setExpanded((value) => !value)}
            >
              {offer}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss Product Hunt welcome"
          className="shrink-0 rounded-lg px-1 text-muted hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-glod"
          onClick={() => {
            setDismissed(true);
            try { localStorage.setItem(PH_DISMISSED, "1"); } catch {
              // Keep the in-memory dismissal when storage is unavailable.
            }
          }}
        >
          Dismiss
        </button>
      </aside>
    </div>
  );
}
