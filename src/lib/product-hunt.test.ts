import assert from "node:assert/strict";
import { test } from "node:test";

import { isProductHuntVisit, PH_COOKIE, shouldShowProductHunt } from "./product-hunt.ts";

test("Product Hunt referral or source enables the welcome", () => {
  for (const query of ["ref=producthunt", "utm_source=producthunt", "ref=other&utm_source=producthunt", "ref=ProductHunt"]) {
    assert.ok(isProductHuntVisit(new URLSearchParams(query)));
    assert.ok(shouldShowProductHunt(`?${query}`, "", null));
  }
  assert.ok(shouldShowProductHunt("", `session=other; ${PH_COOKIE}=1`, null));
});

test("normal, unrelated or malformed visits have no banner", () => {
  for (const query of ["", "ref=", "ref=other", "utm_campaign=producthunt", "ref=%E0%A4%A", "ref=producthunt.example"]) {
    assert.equal(shouldShowProductHunt(query, "", null), false);
  }
  for (const cookie of [`${PH_COOKIE}=0`, `not_${PH_COOKIE}=1`, `${PH_COOKIE}=11`]) {
    assert.equal(shouldShowProductHunt("", cookie, null), false);
  }
});

test("persisted dismissal overrides URL and companion flag", () => {
  assert.equal(shouldShowProductHunt("?ref=producthunt", `${PH_COOKIE}=1`, "1"), false);
});
