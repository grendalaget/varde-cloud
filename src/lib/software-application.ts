export const SOFTWARE_APPLICATION = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Varde",
  url: "https://varde.games",
  image: "https://varde.games/og.png",
  description: "Open-source peer-hosted game servers with replicated saves and automatic failover.",
  applicationCategory: "GameApplication",
  operatingSystem: "Linux, Windows, macOS (client only)",
  license: "https://www.gnu.org/licenses/agpl-3.0.html",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: "https://varde.games/pricing" },
    ...[
      { name: "Anchor monthly", price: "3.99", billingDuration: "P1M" },
      { name: "Anchor yearly", price: "39.90", billingDuration: "P1Y" },
      { name: "Anchor+ monthly", price: "6.00", billingDuration: "P1M" },
    ].map(({ name, price, billingDuration }) => ({
      "@type": "Offer",
      name,
      price,
      priceCurrency: "EUR",
      url: "https://varde.games/pricing",
      priceSpecification: { "@type": "UnitPriceSpecification", price, priceCurrency: "EUR", billingDuration, referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "group" } },
    })),
  ],
};
