import assert from "node:assert/strict";
import { test } from "node:test";

import { sameIp } from "./ip";

test("sameIp compares equivalent IPv6 forms", () => {
  assert.equal(
    sameIp(
      "fdaa:0000:003a:46f5:0a7b:03e9:e7e2:0002",
      "fdaa:0:3a:46f5:a7b:3e9:e7e2:2",
    ),
    true,
  );
  assert.equal(sameIp("Fdaa:0:3A:46F5:A7B:3E9:E7E2:2", "fdaa:0:3a:46f5:a7b:3e9:e7e2:2"), true);
});

test("sameIp compares IPv4-mapped IPv6 and IPv4", () => {
  assert.equal(sameIp("::ffff:10.0.0.1", "10.0.0.1"), true);
});

test("sameIp rejects different or invalid addresses", () => {
  assert.equal(sameIp("10.0.0.1", "10.0.0.2"), false);
  assert.equal(sameIp(undefined, "10.0.0.1"), false);
  assert.equal(sameIp("garbage", "10.0.0.1"), false);
});
