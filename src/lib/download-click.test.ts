import assert from "node:assert/strict";
import { test } from "node:test";

import { downloadClickProps } from "./download-click.ts";
import { TARGETS } from "./release-feed.ts";

test("artifact clicks use the selected target OS, not the browser OS", () => {
  for (const target of Object.keys(TARGETS)) {
    assert.deepEqual(downloadClickProps(`/download/${target}`, "https://varde.games", "unrelated"), {
      os: target === "windows" ? "windows" : target.startsWith("macos-") ? "macos" : "linux", target,
    });
  }
});

test("download page CTAs report a page target and the browser OS", () => {
  for (const [agent, os] of [["Windows NT 10.0", "windows"], ["Macintosh", "macos"], ["Linux x86_64", "linux"], ["Linux Android", "android"], ["iPhone Mac OS X", "ios"], ["", "unknown"]]) {
    assert.deepEqual(downloadClickProps("https://varde.games/download?ref=launch", "https://varde.games", agent), { os, target: "download-page" });
  }
});

test("unrelated, malformed, external and unknown links do not track downloads", () => {
  for (const href of ["", "/", "/docs/host-a-server", "/download/unknown", "/download/windows/extra", "https://elsewhere.example/download/windows", "http://[bad", "javascript:alert(1)"]) {
    assert.equal(downloadClickProps(href, "https://varde.games", "Windows"), null, href);
  }
});
