import assert from "node:assert/strict";
import { test } from "node:test";

import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, attributionFromCookie, landingAttribution } from "./attribution.ts";

test("captures referral and arbitrary utm campaign keys, not unrelated parameters", () => {
  assert.deepEqual(landingAttribution(new URLSearchParams("ref=producthunt&utm_source=producthunt&utm_campaign=launch&token=secret&email=a@b.c")), {
    ref: "producthunt", utm_source: "producthunt", utm_campaign: "launch",
  });
  assert.equal(ATTRIBUTION_MAX_AGE, 2592000);
});

test("empty or unrelated campaigns do not create attribution", () => {
  for (const query of ["", "next=/account", "ref=+&utm_source=", "utm_=invalid"]) {
    assert.equal(landingAttribution(new URLSearchParams(query)), null);
  }
  assert.equal(attributionFromCookie(undefined), null);
  assert.equal(attributionFromCookie(""), null);
});

test("cookie roundtrip sanitises keys and values", () => {
  const value = { ref: "producthunt", utm_medium: "social", password: "not stored", utm_number: 3 };
  const cookie = `other=1; ${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; session=abc`;
  assert.deepEqual(JSON.parse(attributionFromCookie(cookie)!), { ref: "producthunt", utm_medium: "social" });
});

test("malformed, oversized and non-object cookies never break signup", () => {
  for (const raw of ["%", "not-json", "null", "[]", '"text"', "x".repeat(4001), '{"utm_source":5}']) {
    assert.equal(attributionFromCookie(`${ATTRIBUTION_COOKIE}=${raw}`), null);
  }
});

test("untrusted campaign input is bounded to a cookie-sized first value", () => {
  const params = new URLSearchParams("ref=first&ref=second");
  for (let i = 0; i < 20; i++) params.set(`utm_${String.fromCharCode(97 + i)}`, "😀".repeat(200));
  const values = landingAttribution(params)!;
  assert.equal(values.ref, "first");
  assert.ok(Object.keys(values).length <= 12);
  assert.ok(Object.values(values).every((value) => value.length <= 120));
  assert.ok(encodeURIComponent(JSON.stringify(values)).length <= 3000);
  assert.doesNotThrow(() => landingAttribution(new URLSearchParams({ ref: "a".repeat(119) + "😀" })));
});
