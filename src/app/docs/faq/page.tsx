import type { Metadata } from "next";
import Link from "next/link";

import { DocTitle, P } from "@/components/docs-primitives";
import { FaqAccordion } from "@/components/docs/faq-accordion";
import { BILLING_ENABLED } from "@/lib/polar";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions, short answers.",
};

export default function Faq() {
  return (
    <>
      <DocTitle
        title="Frequently asked questions"
        intro="The short answers, in plain words. Expand a question for the details."
      />

      <FaqAccordion billingEnabled={BILLING_ENABLED} />

      <P>
        Something broken? Check{" "}
        <Link href="/docs/troubleshooting">troubleshooting</Link>. Curious
        what a word means? The <Link href="/docs/glossary">glossary</Link> has
        every term, and{" "}
        <Link href="/docs/how-varde-works">how Varde works</Link> puts the
        pieces together.
      </P>
    </>
  );
}
