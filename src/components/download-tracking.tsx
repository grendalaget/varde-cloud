"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { downloadClickProps } from "@/lib/download-click";

export function DownloadTracking() {
  useEffect(() => {
    const track = (event: MouseEvent) => {
      if (event.type === "auxclick" ? event.button !== 1 : event.button !== 0) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link) return;
      const props = downloadClickProps(link.getAttribute("href") ?? "", window.location.origin, navigator.userAgent);
      if (props) trackEvent("download_click", props);
    };
    document.addEventListener("click", track, true);
    document.addEventListener("auxclick", track, true);
    return () => {
      document.removeEventListener("click", track, true);
      document.removeEventListener("auxclick", track, true);
    };
  }, []);
  return null;
}
