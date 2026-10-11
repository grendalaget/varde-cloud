import type { Metadata } from "next";

import { Callout, DocTitle, P } from "@/components/docs-primitives";
import { ProblemFinder } from "@/components/docs/problem-finder";

export const metadata: Metadata = {
  title: "Troubleshooting",
  description: "Install, linking, and connection fixes.",
};

export default function Troubleshooting() {
  return (
    <>
      <DocTitle
        title="Troubleshooting"
        intro="Describe the problem the way you would type it into a search box. Each match expands into the fix."
      />
      <P>
        Most Varde problems are one of a dozen things: an unsigned installer
        warning, an expired code, a machine that is asleep. The finder below
        has the fix for each.
      </P>

      <ProblemFinder />

      <Callout tone="glod" title="When nothing here fits">
        Open an issue on{" "}
        <a
          href="https://github.com/grendalaget/varde/issues"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>{" "}
        with what you tried and your logs attached. Say whether the problem is
        installing, linking, connecting, or in-game, and whether you host or
        join.
      </Callout>
    </>
  );
}
