"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Accordion } from "@heroui/react";

// Themed accordion of the questions every new group asks. HeroUI's Accordion
// (react-aria disclosures) gives keyboard support and the mouve surface style
// for free; answers stay one or two plain sentences with links into the docs.

type QA = { id: string; q: string; a: ReactNode };

const QAS: QA[] = [
  {
    id: "free",
    q: "Is Varde free?",
    a: (
      <>
        Yes. The software is open source under the AGPL-3.0 license and free
        forever, including the hosted control plane at varde.games. The only
        paid extra will be an optional cloud anchor, a managed always-on
        backup for your saves, and it is still marked coming soon on the{" "}
        <Link href="/pricing">pricing page</Link>.
      </>
    ),
  },
  {
    id: "account",
    q: "Do I need a varde.games account?",
    a: (
      <>
        Yes. Linking a machine and joining a group both need a sign-in, so
        every player makes a free account on the{" "}
        <Link href="/auth/sign-up">sign-up page</Link> first. It only takes an
        email and a password.
      </>
    ),
  },
  {
    id: "platforms",
    q: "Does it work on Mac or Linux?",
    a: (
      <>
        The one-click app with the tray icon is for Windows 10 and 11. Linux
        has .deb and .rpm packages for the agent and control plane, aimed at a
        home server or small VPS, and macOS builds are available from source.
        See the <Link href="/download">download page</Link>.
      </>
    ),
  },
  {
    id: "games",
    q: "Which games are supported?",
    a: (
      <>
        Minecraft Java Edition and Valheim today. Game support is built per
        game but grouped by hosting style, so games whose servers work alike
        can share a driver. More are planned.
      </>
    ),
  },
  {
    id: "private",
    q: "Is my world private?",
    a: (
      <>
        Yes. Servers belong to your group only: joining takes an invite link
        from the group&rsquo;s owner, and game traffic travels between your
        own machines, not through a public server list.
      </>
    ),
  },
  {
    id: "anchor",
    q: "What is a cloud anchor, and do I need one?",
    a: (
      <>
        An anchor is a machine that always keeps a copy of every save, so the
        newest one survives even when every PC is off. You can flag your own
        always-on machine (a NAS, home server or small VPS) for free, or use a
        cloud anchor run by Varde for you. Paid anchors are still coming soon,
        and most groups never need one.
      </>
    ),
  },
  {
    id: "save",
    q: "Where does my save live?",
    a: (
      <>
        On your group&rsquo;s own machines. Every machine that can host keeps
        a copy, and an anchor keeps another. Varde does not hold your save
        unless you choose a cloud anchor; the control plane only tracks who
        has which copy.
      </>
    ),
  },
  {
    id: "no-install",
    q: "Can my friends join without installing anything?",
    a: (
      <>
        No, every player installs Varde and links their PC. That is how each
        machine gets the stable local address for the server. The upside:
        nobody touches router settings or shares an IP.
      </>
    ),
  },
  {
    id: "host-off",
    q: "What happens when the host\u2019s PC turns off?",
    a: (
      <>
        The server moves to another machine in the group that holds the save.
        Players see a short disconnect, then reconnect to the same address. If
        every machine is off, the server sleeps until someone comes back, and
        an anchor makes sure the newest save is waiting.
      </>
    ),
  },
  {
    id: "encryption",
    q: "Is my traffic encrypted?",
    a: (
      <>
        Yes. Machines talk over an encrypted mesh, and when a direct path is
        blocked a relay forwards the traffic for you. The relay only passes
        encrypted bytes; it cannot read them. See{" "}
        <Link href="/docs/how-varde-works">how Varde works</Link> for the
        picture.
      </>
    ),
  },
];

export function FaqAccordion() {
  return (
    <Accordion variant="surface" className="my-8">
      {QAS.map((qa) => (
        <Accordion.Item key={qa.id} id={qa.id}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {qa.q}
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="leading-relaxed [&_a]:text-glod [&_a]:underline">
              {qa.a}
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
