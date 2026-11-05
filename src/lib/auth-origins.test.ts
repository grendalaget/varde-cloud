import assert from "node:assert/strict";
import { test } from "node:test";
import { authBaseURL } from "./auth-origins.ts";
import { sameOriginRequest } from "./csrf.ts";

test("production without BETTER_AUTH_URL uses the canonical origin, not the deployment URL", () => {
  const baseURL = authBaseURL({ VERCEL_ENV: "production", VERCEL_URL: "varde-deployment.vercel.app" });
  assert.equal(baseURL, "https://varde.games");
  const request = new Request(`${baseURL}/api/auth/sign-in/email`, {
    method: "POST", headers: { Origin: baseURL },
  });
  assert.equal(sameOriginRequest(request, baseURL), true);
});

test("base URL resolution preserves explicit, preview and development defaults", () => {
  assert.equal(authBaseURL({ BETTER_AUTH_URL: "https://custom.example", VERCEL_ENV: "production" }), "https://custom.example");
  assert.equal(authBaseURL({ VERCEL_ENV: "preview", VERCEL_URL: "preview.vercel.app" }), "https://preview.vercel.app");
  assert.equal(authBaseURL({ VERCEL_ENV: "preview" }), "http://localhost:3000");
  assert.equal(authBaseURL({ VERCEL_URL: "unused.vercel.app" }), "http://localhost:3000");
  assert.equal(authBaseURL({}), "http://localhost:3000");
});
