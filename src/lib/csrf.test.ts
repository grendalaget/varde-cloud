import assert from "node:assert/strict";
import { test } from "node:test";
import { sameOriginRequest, withSameOrigin } from "./csrf.ts";

const url = "https://varde.games/api/cp/groups";
for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  test(`${method} requires exact origin or trustworthy missing-Origin metadata`, () => {
    for (const origin of ["https://varde.games", "https://srv-example.play.varde.games", "https://cp.varde.games", "null", "", "https://varde.games/", "https://varde.games.evil.test"]) {
      const request = new Request(url, { method, headers: { Origin: origin, "Sec-Fetch-Site": "same-origin" } });
      assert.equal(sameOriginRequest(request), origin === "https://varde.games", origin);
    }
    for (const site of ["same-origin", "none", "same-site", "cross-site", ""]) {
      assert.equal(sameOriginRequest(new Request(url, { method, headers: { "Sec-Fetch-Site": site } })), site === "same-origin" || site === "none", site);
    }
    assert.equal(sameOriginRequest(new Request(url, { method })), false);
    assert.equal(sameOriginRequest(new Request(url, { method, headers: { Authorization: "Bearer arbitrary" } })), false);
  });
}

test("read-only methods do not require Origin", () => {
  for (const method of ["GET", "HEAD", "OPTIONS"]) assert.equal(sameOriginRequest(new Request(url, { method })), true);
});

test("configured site origin cannot be replaced by a forwarded request host", () => {
  const request = new Request("https://srv-example.play.varde.games/api/cp/groups", {
    method: "POST", headers: { Origin: "https://srv-example.play.varde.games" },
  });
  assert.equal(sameOriginRequest(request, ["https://varde.games"]), false);
});

test("only the exact signed Polar webhook POST is exempt", () => {
  assert.equal(sameOriginRequest(new Request("https://varde.games/api/auth/polar/webhooks", { method: "POST" })), true);
  for (const path of ["/api/auth/polar/webhooks/", "/api/auth/polar/webhooks/extra", "/api/auth/desktop-token", "/api/auth/sign-in/email"]) {
    assert.equal(sameOriginRequest(new Request(`https://varde.games${path}`, { method: "POST" })), false, path);
  }
  assert.equal(sameOriginRequest(new Request("https://varde.games/api/auth/polar/webhooks", { method: "DELETE" })), false);
});

test("wrapper rejects before invoking the handler and preserves route arguments", async () => {
  let calls = 0;
  const handler = withSameOrigin(async (_request: Request, context: { id: string }) => {
    calls++;
    return Response.json(context);
  });
  const denied = await handler(new Request(url, { method: "POST" }), { id: "test" });
  assert.equal(denied.status, 403);
  assert.equal(calls, 0);
  const allowed = await handler(new Request(url, { method: "POST", headers: { Origin: "https://varde.games" } }), { id: "test" });
  assert.equal(allowed.status, 200);
  assert.deepEqual(await allowed.json(), { id: "test" });
  assert.equal(calls, 1);
});
