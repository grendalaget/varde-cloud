import assert from "node:assert/strict";
import { test } from "node:test";
import { createCookieGetter, getCookies } from "better-auth/cookies";

import { authCookieOptions } from "./auth-cookies.ts";

for (const baseURL of ["https://varde.games", "https://preview.vercel.app"]) {
  test(`auth cookies are host-only and __Host- prefixed on ${baseURL}`, () => {
    const options = { baseURL, advanced: authCookieOptions(baseURL) };
    const cookies = {
      ...getCookies(options),
      oauthState: createCookieGetter(options)("oauth_state"),
    };
    for (const cookie of Object.values(cookies)) {
      assert.ok(cookie.name.startsWith("__Host-varde."), cookie.name);
      assert.equal(cookie.attributes.secure, true);
      assert.equal(cookie.attributes.httpOnly, true);
      assert.equal(cookie.attributes.path, "/");
      assert.equal(cookie.attributes.sameSite, "lax");
      assert.equal(cookie.attributes.domain, undefined);
    }
  });
}

test("local HTTP development uses host-only cookies without a secure prefix", () => {
  const baseURL = "http://localhost:3000";
  const cookies = getCookies({ baseURL, advanced: authCookieOptions(baseURL) });
  assert.equal(cookies.sessionToken.name, "varde.session_token");
  assert.equal(cookies.sessionToken.attributes.secure, false);
  assert.equal(cookies.sessionToken.attributes.domain, undefined);
});

test("invalid or empty auth base URLs are rejected", () => {
  for (const baseURL of ["", "not a URL"]) {
    assert.throws(() => authCookieOptions(baseURL), TypeError);
  }
});
