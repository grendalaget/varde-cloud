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
  const offer = process.env.NEXT_PUBLIC_PH_OFFER?.trim();
  if (!visible || dismissed) return null;

  return (
    <div className="px-3 py-3">
      <aside aria-label="Product Hunt welcome" className="mx-auto flex max-w-3xl items-start gap-4 rounded-2xl border border-glod/40 bg-surface p-4 text-sm shadow-xl">
        <div className="min-w-0 flex-1 break-words">
          <p className="font-medium text-foreground">Welcome, Product Hunt visitors.</p>
          {offer ? <p className="mt-1 text-muted">{offer}</p> : null}
        </div>
        <button
          type="button"
          aria-label="Dismiss Product Hunt welcome"
          className="shrink-0 rounded-lg px-2 py-1 text-muted hover:bg-surface-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-glod"
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
