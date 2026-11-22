import assert from "node:assert/strict";
import { test } from "node:test";

import { downloadResponse } from "./download-response.ts";
import { RELEASES_URL, TARGETS } from "./release-feed.ts";

test("allowlisted artifact redirects have a short shared-cache lifetime", async () => {
  for (const target of Object.keys(TARGETS)) {
    const url = `https://github.com/grendalaget/varde/releases/download/nightly/${target}`;
    const response = await downloadResponse(target, async () => ({ urls: { [target]: url } }));
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), url);
    assert.equal(response.headers.get("cache-control"), "public, max-age=0, s-maxage=60");
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("unknown targets never load a release and remain uncached", async () => {
  for (const target of ["", "unknown", "__proto__", "constructor"]) {
    const response = await downloadResponse(target, async () => { throw new Error("must not load"); });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("missing releases and target artifacts fall back without caching", async () => {
  for (const release of [null, { urls: {} }]) {
    const response = await downloadResponse("windows", async () => release);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), RELEASES_URL);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("release lookup errors remain uncached", async () => {
  const response = await downloadResponse("windows", async () => { throw new Error("offline"); });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
