import { createPolar, createPolarCore } from "@polar-sh/sdk/2026-10";

const environment =
  process.env.POLAR_SERVER === "production" ? ("production" as const) : ("sandbox" as const);

// Production reads POLAR_PROD_ACCESS_TOKEN first so a project can hold both
// tokens (sandbox for previews/dev, prod for production) without collisions.
const accessToken =
  environment === "production"
    ? (process.env.POLAR_PROD_ACCESS_TOKEN ?? process.env.POLAR_ACCESS_TOKEN)
    : process.env.POLAR_ACCESS_TOKEN;

// Billing is opt-in: without an access token the site stays in
// "coming soon" mode: no checkout buttons, no webhook expectations.
export const BILLING_ENABLED = Boolean(accessToken);

// PolarCore is what the better-auth plugin consumes;
// the service client (customers, products, ...) is for our own calls.
export const polarCore = BILLING_ENABLED
  ? createPolarCore({
      accessToken: accessToken!,
      // "sandbox" until the production org + products exist.
      environment,
    })
  : null;

export const polar = BILLING_ENABLED
  ? createPolar({
      accessToken: accessToken!,
      environment,
    })
  : null;

// Product IDs come from the Polar dashboard, different per environment.
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
