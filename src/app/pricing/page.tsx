import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutButton } from "@/components/checkout-button";
import { BILLING_ENABLED } from "@/lib/polar";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Varde is open source and self-hostable for free. Managed cloud anchors are coming soon.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    tag: "Open source",
    highlight: false,
    features: [
      "Everything self-hostable — the whole stack",
      "Hosted control plane at varde.games",
      "Peer-hosted servers with automatic failover",
      "Self-hosted anchor nodes",
      "Small free cloud anchor (fair use)",
    ],
  },
  {
    name: "Anchor",
    price: "$3",
    cadence: "per group / month",
    altPrice: "$30 per year",
    tag: "Coming soon",
    highlight: true,
    slug: "anchor-monthly",
    yearlySlug: "anchor-yearly",
    features: [
      "Managed always-on cloud anchor",
      "~25 GB deduplicated save storage",
      "All servers in the group",
      "1 region",
      "Saves survive with every player PC offline",
    ],
  },
  {
    name: "Anchor+",
    price: "$6",
    cadence: "per group / month",
    tag: "Coming soon",
    highlight: false,
    slug: "anchor-plus",
    features: [
      "Everything in Anchor",
      "~100 GB deduplicated save storage",
      "2 regions",
      "More relay capacity",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Pricing
        </h1>
        <p className="mt-4 text-lg text-muted">
          Varde&apos;s core is open source and free forever — anchors are an
          optional convenience for groups that want always-on save replication
          without running their own always-on machine.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-separator bg-surface px-3 py-1 text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-warn" />
          Plans are indicative and not yet available — checkout is coming soon.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-7 ${
              plan.highlight
                ? "border-glod/50 bg-surface shadow-[0_0_50px_rgba(255,91,31,0.07)]"
                : "border-separator bg-surface"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${
                  plan.tag === "Coming soon"
                    ? "border border-separator bg-surface-secondary text-warn"
                    : "border border-separator bg-surface-secondary text-muted"
                }`}
              >
                {plan.tag}
              </span>
            </div>
            <div className="mt-5">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              <span className="ml-2 text-sm text-muted">{plan.cadence}</span>
              {plan.altPrice ? (
                <p className="mt-1 text-sm text-muted">or {plan.altPrice}</p>
              ) : null}
            </div>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <svg
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-4 w-4 shrink-0 text-skifer-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {plan.name === "Free" ? (
              <Link
                href="/download"
                className="mt-8 rounded-lg border border-separator bg-surface-secondary px-4 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-surface-tertiary"
              >
                Get started
              </Link>
            ) : (
              <div className="mt-8">
                <CheckoutButton
                  slug={plan.slug!}
                  billingEnabled={BILLING_ENABLED}
                  label={
                    plan.highlight
                      ? `Get ${plan.name}`
                      : `Get ${plan.name} monthly`
                  }
                  variant={plan.highlight ? "primary" : "secondary"}
                />
                {"yearlySlug" in plan && plan.yearlySlug ? (
                  <div className="mt-2 text-center">
                    <CheckoutButton
                      slug={plan.yearlySlug}
                      billingEnabled={BILLING_ENABLED}
                      label="or $30/year"
                      variant="link"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-2xl text-sm text-muted">
        Deduplicated, compressed save chunks keep storage cheap — most groups
        will never notice the cap. Prices are per group, not per player, and may
        change before launch.
      </p>
    </main>
  );
}
