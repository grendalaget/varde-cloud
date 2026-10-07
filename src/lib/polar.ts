import { createPolar, createPolarCore } from "@polar-sh/sdk/2026-10";

// Billing is opt-in: without POLAR_ACCESS_TOKEN the site stays in
// "coming soon" mode — no checkout buttons, no webhook expectations.
export const BILLING_ENABLED = Boolean(process.env.POLAR_ACCESS_TOKEN);

const environment =
  process.env.POLAR_SERVER === "production" ? ("production" as const) : ("sandbox" as const);

// PolarCore is what the better-auth plugin consumes;
// the service client (customers, products, ...) is for our own calls.
export const polarCore = BILLING_ENABLED
  ? createPolarCore({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      // "sandbox" until the production org + products exist.
      environment,
    })
  : null;

export const polar = BILLING_ENABLED
  ? createPolar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      environment,
    })
  : null;

// Product IDs come from the Polar dashboard — different per environment.
export const POLAR_PRODUCTS = [
  { productId: process.env.POLAR_ANCHOR_MONTHLY_PRODUCT_ID ?? "", slug: "anchor-monthly" },
  { productId: process.env.POLAR_ANCHOR_YEARLY_PRODUCT_ID ?? "", slug: "anchor-yearly" },
  { productId: process.env.POLAR_ANCHOR_PLUS_PRODUCT_ID ?? "", slug: "anchor-plus" },
].filter((p) => p.productId);

export type Plan = "free" | "anchor" | "anchor+";

// Map a Polar product ID to our internal plan name.
export function planForProduct(productId: string): Plan {
  if (productId === process.env.POLAR_ANCHOR_PLUS_PRODUCT_ID) return "anchor+";
  if (
    productId === process.env.POLAR_ANCHOR_MONTHLY_PRODUCT_ID ||
    productId === process.env.POLAR_ANCHOR_YEARLY_PRODUCT_ID
  ) {
    return "anchor";
  }
  return "free";
}
