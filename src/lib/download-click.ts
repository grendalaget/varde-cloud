import { TARGETS } from "./release-feed.ts";

export function downloadClickProps(href: string, origin: string, userAgent: string): { os: string; target: string } | null {
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return null;
    if (url.pathname === "/download" || url.pathname === "/download/") {
      const os = /android/i.test(userAgent) ? "android" : /iphone|ipad|ipod/i.test(userAgent) ? "ios" : /windows/i.test(userAgent) ? "windows" : /macintosh|mac os x/i.test(userAgent) ? "macos" : /linux/i.test(userAgent) ? "linux" : "unknown";
      return { os, target: "download-page" };
    }
    const target = url.pathname.split("/")[2];
    if (url.pathname !== `/download/${target}` || !Object.hasOwn(TARGETS, target)) return null;
    return { os: target === "windows" ? "windows" : target.startsWith("macos-") ? "macos" : "linux", target };
  } catch {
    return null;
  }
}
