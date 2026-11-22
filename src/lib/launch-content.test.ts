import assert from "node:assert/strict";
import { test } from "node:test";

import { LAUNCH_PAGES, launchMetadata } from "./launch-content.ts";
import { SOFTWARE_APPLICATION } from "./software-application.ts";

test("launch pages have unique routes, useful copy and route-specific metadata", () => {
  assert.equal(LAUNCH_PAGES.length, 7);
  assert.equal(new Set(LAUNCH_PAGES.map((page) => page.path)).size, 7);
  for (const page of LAUNCH_PAGES) {
    const metadata = launchMetadata(page);
    assert.equal(metadata.title, page.title);
    assert.equal(metadata.description, page.description);
    assert.deepEqual(metadata.alternates, { canonical: page.path });
    assert.equal(metadata.openGraph?.description, page.description);
    assert.equal(metadata.openGraph && "url" in metadata.openGraph && metadata.openGraph.url, page.path);
    assert.ok(metadata.openGraph?.images);
    assert.ok(metadata.twitter);
    assert.ok(page.sections.length >= 3);
    assert.doesNotMatch(JSON.stringify(page), /[\u2013\u2014]|\bworld\b/i);
  }
});

test("software application offers match the displayed prices and billing intervals", () => {
  const data = JSON.parse(JSON.stringify(SOFTWARE_APPLICATION));
  assert.equal(data["@type"], "SoftwareApplication");
  assert.equal(data.offers.length, 4);
  assert.deepEqual(data.offers.map((offer: { price: string; priceCurrency: string }) => [offer.price, offer.priceCurrency]), [
    ["0", "USD"], ["3.99", "EUR"], ["39.90", "EUR"], ["6.00", "EUR"],
  ]);
  assert.deepEqual(data.offers.slice(1).map((offer: { priceSpecification: { billingDuration: string } }) => offer.priceSpecification.billingDuration), ["P1M", "P1Y", "P1M"]);
  for (const offer of data.offers) {
    assert.equal(offer.url, "https://varde.games/pricing");
  }
});
