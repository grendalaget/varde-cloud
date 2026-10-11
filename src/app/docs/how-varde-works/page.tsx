import type { Metadata } from "next";
import Link from "next/link";

import { Callout, DocTitle, H2, P } from "@/components/docs-primitives";
import { TopologyExplorer } from "@/components/docs/topology-explorer";
import { PathPicker } from "@/components/docs/path-picker";
import { FailoverTimeline } from "@/components/docs/failover-timeline";

export const metadata: Metadata = {
  title: "How Varde works",
  description: "Peers, relays, and the control plane, visualized.",
};

export default function HowVardeWorks() {
  return (
    <>
      <DocTitle
        title="How Varde works"
        intro="The moving parts, shown instead of told. A few minutes and you will know where your world lives, where your traffic goes, and what Varde can never see."
      />

      <H2>The pieces</H2>
      <P>
        The <strong className="text-foreground">agent</strong> is the small app
        on every machine: it keeps you linked to the group and can run the
        world when asked. The{" "}
        <strong className="text-foreground">control plane</strong> is Varde&rsquo;s
        address book: it hands out{" "}
        <strong className="text-foreground">link codes</strong> (the short
        invites friends redeem to join) and tells machines where to find each
        other. Machines that can host each keep a{" "}
        <strong className="text-foreground">replicated save</strong>, an
        identical copy of the world. And the{" "}
        <strong className="text-foreground">relay</strong> is an encrypted
        detour, used only when a direct path is blocked.
      </P>

      <TopologyExplorer />

      <H2>Where your traffic goes</H2>
      <P>
        The control plane only introduces your machines to each other. After
        that, your game data travels between the machines themselves, and it
        takes the shortest route it can find.
      </P>

      <PathPicker />

      <H2>When someone goes offline</H2>
      <P>
        Hosting moves around the group. Because a second machine already holds
        an identical save, the world survives its host disappearing mid-game.
        Step through a failover:
      </P>

      <FailoverTimeline />

      <H2>What Varde can&rsquo;t see</H2>
      <P>
        Relayed or not, game traffic is encrypted between machines. The relay
        moves sealed packets it cannot open, and the control plane only knows
        who is in your group and which machines are online. Your world, your
        items, and your chat never pass through Varde readable.
      </P>

      <Callout tone="glod" title="In one line">
        The machines and the saves belong to your group. Varde introduces them
        and keeps the lights on; it never plays, stores, or reads your game.
      </Callout>

      <H2>Keep going</H2>
      <P>
        Ready to try it? <Link href="/docs/join-a-server">Join a friend&rsquo;s
        server</Link> or <Link href="/docs/host-a-server">host your own</Link>.
        Any term still fuzzy? The <Link href="/docs/glossary">glossary</Link>{" "}
        has every word in plain language.
      </P>
    </>
  );
}
