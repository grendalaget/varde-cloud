export type AnalyticsEvent = "download_click" | "sign_up_started" | "sign_up_completed" | "email_verified" | "checkout_started";
export type EventProps = Record<string, string>;

type Plausible = ((name: string, options?: { props?: EventProps; u?: string }) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function trackEvent(name: AnalyticsEvent, props: EventProps = {}) {
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || typeof window === "undefined") return;
  try {
    window.plausible ??= Object.assign(
      (...args: unknown[]) => { window.plausible?.q?.push(args); },
      { q: [] as unknown[][] },
    );
    window.plausible(name, { props, u: pageviewUrl(window.location.href) });
  } catch {
    // Analytics must not interrupt account or billing actions.
  }
}

export function pageviewUrl(href: string): string {
  const url = new URL(href);
  const kept = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key === "ref" || key.startsWith("utm_")) kept.append(key, value);
  }
  const query = kept.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}

export function plausibleEventEndpoint(scriptSrc: string): string {
  return new URL("/api/event", new URL(scriptSrc)).toString();
}

export async function trackServerEvent(
  name: Exclude<AnalyticsEvent, "download_click">,
  request?: Request,
  props: EventProps = {},
) {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;
  try {
    const endpoint = plausibleEventEndpoint(process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC || "https://plausible.io/js/script.manual.js");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const agent = request?.headers.get("user-agent");
    const ip = request?.headers.get("x-forwarded-for");
    if (agent) headers["User-Agent"] = agent;
    if (ip) headers["X-Forwarded-For"] = ip;
    await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, domain, url: `https://${domain}/auth/sign-up`, props }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Delivery is best effort and never blocks the primary action on failure.
  }
}
