import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNext } from "./next.ts";

test("safeNext keeps same-site paths", () => {
  assert.equal(safeNext("/account"), "/account");
  assert.equal(safeNext("/federate/cp?next=%2Fgroups"), "/federate/cp?next=%2Fgroups");
});

test("safeNext rejects anything that leaves the origin", () => {
  for (const bad of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "account",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeNext(bad), undefined, String(bad));
  }
});
