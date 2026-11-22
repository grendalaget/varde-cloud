import assert from "node:assert/strict";
import { test } from "node:test";

import { pageviewUrl, plausibleEventEndpoint, trackEvent, trackServerEvent } from "./analytics.ts";

test("analytics is a no-op without a configured domain", async (t) => {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  t.after(() => {
    if (domain === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = domain;
  });
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("must not fetch"); });
  trackEvent("sign_up_started");
  await trackServerEvent("sign_up_completed");
  assert.equal(fetch.mock.callCount(), 0);
});

test("server event uses self-hosted origin and excludes request query and cookies", async (t) => {
  const oldDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const oldSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC;
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "varde.games";
  process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC = "https://stats.example.com/js/script.js";
  t.after(() => {
    if (oldDomain === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = oldDomain;
    if (oldSrc === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC = oldSrc;
  });
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 202 }));
  await trackServerEvent("sign_up_completed", new Request("https://varde.games/auth/sign-up?token=secret", {
    headers: { "user-agent": "test browser", "x-forwarded-for": "192.0.2.1", cookie: "session=secret" },
  }));
  const [url, init] = fetch.mock.calls[0].arguments;
  assert.equal(url, "https://stats.example.com/api/event");
  const options = init as RequestInit;
  assert.deepEqual(JSON.parse(options.body as string), {
    name: "sign_up_completed", domain: "varde.games", url: "https://varde.games/auth/sign-up",
    props: {},
  });
  assert.equal((options.headers as Record<string, string>)["Cookie"], undefined);
  assert.equal((options.headers as Record<string, string>)["User-Agent"], "test browser");
  assert.ok(options.signal);
});

test("analytics tolerates network failures and invalid script URLs", async (t) => {
  const oldDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const oldSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC;
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "varde.games";
  delete process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC;
  t.after(() => {
    if (oldDomain === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = oldDomain;
    if (oldSrc === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC = oldSrc;
  });
  t.mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  await assert.doesNotReject(trackServerEvent("email_verified"));
  process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC = "invalid";
  await assert.doesNotReject(trackServerEvent("sign_up_completed"));
  trackEvent("checkout_started");
  assert.equal(plausibleEventEndpoint("https://plausible.io/js/script.js"), "https://plausible.io/api/event");
});

test("client events queue before the script loads and tolerate a blocked script", (t) => {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "varde.games";
  const browser = { location: { href: "https://varde.games/auth/reset?token=secret&code=private&utm_source=producthunt#secret" } } as Window & typeof globalThis;
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  t.after(() => {
    Reflect.deleteProperty(globalThis, "window");
    if (domain === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = domain;
  });
  trackEvent("sign_up_started");
  trackEvent("checkout_started", { plan: "anchor-monthly" });
  assert.deepEqual(browser.plausible?.q, [
    ["sign_up_started", { props: {}, u: "https://varde.games/auth/reset?utm_source=producthunt" }],
    ["checkout_started", { props: { plan: "anchor-monthly" }, u: "https://varde.games/auth/reset?utm_source=producthunt" }],
  ]);
  browser.plausible = () => { throw new Error("blocked"); };
  assert.doesNotThrow(() => trackEvent("sign_up_started"));
});

test("loaded client analytics receives a sanitized URL for download events", (t) => {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = "varde.games";
  const calls: unknown[][] = [];
  const browser = {
    location: { href: "https://varde.games/auth/reset?token=secret&code=private&ref=producthunt#secret" },
    plausible: (...args: unknown[]) => { calls.push(args); },
  } as unknown as Window & typeof globalThis;
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  t.after(() => {
    Reflect.deleteProperty(globalThis, "window");
    if (domain === undefined) delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    else process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN = domain;
  });
  trackEvent("download_click", { os: "windows", target: "windows" });
  assert.deepEqual(calls, [["download_click", {
    props: { os: "windows", target: "windows" },
    u: "https://varde.games/auth/reset?ref=producthunt",
  }]]);
});

test("pageview URLs drop secrets from the query string but keep attribution", () => {
  assert.equal(
    pageviewUrl("https://varde.games/auth/reset?token=secret&utm_source=producthunt&ref=ph"),
    "https://varde.games/auth/reset?utm_source=producthunt&ref=ph",
  );
  assert.equal(pageviewUrl("https://varde.games/auth/reset?token=secret#x"), "https://varde.games/auth/reset");
});
