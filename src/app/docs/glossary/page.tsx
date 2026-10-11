import type { Metadata } from "next";
import Link from "next/link";

import { DocTitle, P } from "@/components/docs-primitives";
import { GlossaryIndex } from "@/components/docs/glossary-index";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Every Varde term in plain words.",
};

export default function Glossary() {
  return (
    <>
      <DocTitle
        title="Glossary"
        intro="Every Varde word in one plain sentence. Filter the list or jump to a letter."
      />

      <GlossaryIndex />

      <P>
        See the terms in action in{" "}
        <Link href="/docs/how-varde-works">how Varde works</Link>.
      </P>
    </>
  );
}
