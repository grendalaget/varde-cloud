"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { pageviewUrl } from "@/lib/analytics";

// Manual pageviews so query strings (password reset tokens, invite codes)
// never reach the analytics endpoint; only ref and utm_* are kept.
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const pathname = usePathname();

  useEffect(() => {
    if (!domain) return;
    window.plausible ??= Object.assign(
      (...args: unknown[]) => { window.plausible?.q?.push(args); },
      { q: [] as unknown[][] },
    );
    window.plausible("pageview", { u: pageviewUrl(window.location.href) });
  }, [domain, pathname]);

  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src={process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC || "https://plausible.io/js/script.manual.js"}
    />
  );
}
