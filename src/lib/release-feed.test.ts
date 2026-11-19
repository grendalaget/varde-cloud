import assert from "node:assert/strict";
import { test } from "node:test";

import { releaseFromFeed, signingFromBody } from "./release-feed.ts";

const base = "https://github.com/grendalaget/varde/releases/download/nightly";

test("releaseFromFeed picks direct installer links", () => {
  const r = releaseFromFeed("nightly", {
    version: "0.0.0-nightly.20261109+c07bb69",
    pub_date: "2026-11-09T13:38:17Z",
    platforms: {
      "windows-x86_64": { url: `${base}/VardeSetup.exe` },
      "darwin-aarch64-app": { url: `${base}/Varde-macos-arm64.dmg` },
      "linux-x86_64-agent-deb": { url: "https://evil.example/agent.deb" },
    },
  });
  assert.equal(r?.version, "0.0.0-nightly.20261109+c07bb69");
  assert.equal(r?.urls.windows, `${base}/VardeSetup.exe`);
  assert.equal(r?.urls["macos-arm64"], `${base}/Varde-macos-arm64.dmg`);
  assert.equal(r?.urls["linux-deb"], undefined);
  assert.equal(r?.pageUrl, "https://github.com/grendalaget/varde/releases/tag/nightly");
});

test("releaseFromFeed needs a Windows installer", () => {
  assert.equal(releaseFromFeed("stable", null), null);
  assert.equal(releaseFromFeed("stable", { version: "1.0.0", platforms: {} }), null);
});

test("signingFromBody reads the nightly marker", () => {
  assert.equal(signingFromBody("x <!-- nightly-signing:none-upd --> y"), "unsigned");
  assert.equal(signingFromBody("<!-- nightly-signing:azure-1a2b3c4d-upd -->"), "signed");
  assert.equal(signingFromBody("no marker"), "unknown");
  assert.equal(signingFromBody(undefined), "unknown");
});
