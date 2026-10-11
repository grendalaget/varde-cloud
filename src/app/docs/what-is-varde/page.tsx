import type { Metadata } from "next";
import Link from "next/link";

import { Callout, DocTitle, H2, P } from "@/components/docs-primitives";
import { PeerDiagram } from "@/components/docs/peer-diagram";

export const metadata: Metadata = {
  title: "What is Varde?",
  description:
    "Game servers your whole group keeps alive, explained in five minutes.",
};

export default function WhatIsVarde() {
  return (
    <>
      <DocTitle
        title="What is Varde?"
        intro="Varde lets a group of friends run a game server that stays online even when the host&rsquo;s computer doesn't. No rented hardware, no sysadmin skills."
      />

      <H2>The problem it solves</H2>
      <P>
        Today, playing Minecraft (or Valheim, or Terraria) with friends means
        one person&rsquo;s machine is the server. When their laptop closes, the
        world is gone. When their internet hiccups, everyone lags. Renting a
        server fixes that but costs money every month and makes a stranger&rsquo;s
        datacenter the owner of your world.
      </P>
      <P>
        Varde takes a third path: the server lives with your group. Everyone
        installs a small app, the machines link together, and Varde keeps the
        world running on whichever machine is available. If the host drops,
        the world moves to the next machine and keeps going.
      </P>

      <PeerDiagram />

      <H2>The pieces, in plain words</H2>
      <P>
        The app you install is the <strong className="text-foreground">agent</strong>.
        It runs quietly in your tray and talks to the rest of the group. A
        shared <strong className="text-foreground">control plane</strong> is
        the group&rsquo;s address book: it hands out invites, remembers who owns
        which server, and tells machines how to find each other. Your actual
        game traffic travels directly between your machines, or through an
        encrypted <strong className="text-foreground">relay</strong> when a
        direct path is blocked.
      </P>
      <P>
        Every machine that hosts keeps a copy of the save. That is what makes
        failover safe: if a machine disappears mid-game, another machine
        picks up the world with everyone&rsquo;s progress intact.
      </P>

      <Callout tone="glod" title="The short version">
        Your group is the server. Varde just makes that reliable.
      </Callout>

      <H2>Where to go next</H2>
      <P>
        Playing on a friend&rsquo;s server? Follow the{" "}
        <Link href="/docs/join-a-server">join guide</Link>. Want to run the
        world yourself? Follow the{" "}
        <Link href="/docs/host-a-server">host guide</Link>. Curious about the
        machinery? See{" "}
        <Link href="/docs/how-varde-works">how Varde works</Link>.
      </P>
    </>
  );
}
