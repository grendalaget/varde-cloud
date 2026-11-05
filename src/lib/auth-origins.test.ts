import assert from "node:assert/strict";
import { test } from "node:test";
import { authBaseURL, authOriginOptions } from "./auth-origins.ts";
import { sameOriginRequest } from "./csrf.ts";

test("production without BETTER_AUTH_URL uses the canonical origin, not the deployment URL", () => {
  const { baseURL, trustedOrigins } = authOriginOptions({ VERCEL_ENV: "production", VERCEL_URL: "varde-deployment.vercel.app" });
  assert.equal(baseURL, "https://varde.games");
  const request = new Request(`${baseURL}/api/auth/sign-in/email`, {
    method: "POST", headers: { Origin: baseURL },
  });
  assert.equal(sameOriginRequest(request, trustedOrigins), true);
});

test("www sign-in and sign-up use the same exact trusted origins as Better Auth", () => {
  const { trustedOrigins } = authOriginOptions({ VERCEL_ENV: "production" });
  for (const path of ["sign-in/email", "sign-up/email"]) {
    for (const origin of trustedOrigins) {
      const request = new Request(`https://www.varde.games/api/auth/${path}`, {
        method: "POST", headers: { Origin: origin },
      });
      assert.equal(sameOriginRequest(request, trustedOrigins), true, origin);
    }
  }
});

test("only explicitly configured deployment hosts are trusted, never hosted siblings", () => {
  const environments = [
    {},
    { VERCEL_ENV: "production", VERCEL_URL: "deployment.vercel.app" },
    { VERCEL_ENV: "preview", VERCEL_URL: "preview.vercel.app", VERCEL_BRANCH_URL: "branch.vercel.app" },
    { BETTER_AUTH_URL: "https://custom.example/auth" },
  ];
  for (const environment of environments) {
    const { baseURL, trustedOrigins } = authOriginOptions(environment);
    assert.ok(trustedOrigins.includes(new URL(baseURL).origin));
    for (const host of [environment.VERCEL_URL, environment.VERCEL_BRANCH_URL].filter(Boolean)) {
      assert.ok(trustedOrigins.includes(`https://${host}`));
    }
    for (const origin of ["https://srv-example.play.varde.games", "https://play.varde.games", "https://cp.varde.games", "https://docs.varde.games", "https://other.vercel.app", "https://www.varde.games.evil.test", "https://www.varde.games/", "null"]) {
      assert.equal(sameOriginRequest(new Request("https://varde.games/api/cp/groups", {
        method: "POST", headers: { Origin: origin, "Sec-Fetch-Site": "same-origin" },
      }), trustedOrigins), false, origin);
    }
    assert.equal(trustedOrigins.some((origin) => origin.includes("*")), false);
  }
});

test("invalid configured auth URLs fail closed", () => {
  for (const baseURL of ["", "not a URL"]) {
    assert.throws(() => authOriginOptions({ BETTER_AUTH_URL: baseURL }), TypeError);
  }
});

test("base URL resolution preserves explicit, preview and development defaults", () => {
  assert.equal(authBaseURL({ BETTER_AUTH_URL: "https://custom.example", VERCEL_ENV: "production" }), "https://custom.example");
  assert.equal(authBaseURL({ VERCEL_ENV: "preview", VERCEL_URL: "preview.vercel.app" }), "https://preview.vercel.app");
  assert.equal(authBaseURL({ VERCEL_ENV: "preview" }), "http://localhost:3000");
  assert.equal(authBaseURL({ VERCEL_URL: "unused.vercel.app" }), "http://localhost:3000");
  assert.equal(authBaseURL({}), "http://localhost:3000");
});
