import { Chip } from "@heroui/react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Callout,
  DocTitle,
  H2,
  P,
  Step,
  Steps,
} from "@/components/docs-primitives";
import { CreateServerMock } from "@/components/docs/create-server-mock";
import { DocChecklist } from "@/components/docs/doc-checklist";
import { InviteCardMock } from "@/components/docs/invite-card-mock";
import { TrayMenuMock } from "@/components/docs/tray-menu-mock";

export const metadata: Metadata = {
  title: "Host a server",
  description:
    "Turn your machine into a server your friends can always reach.",
};

const NEED = [
  "A Windows PC",
  "About 10 minutes",
  "Friends to invite",
];

export default function HostAServer() {
  return (
    <>
      <DocTitle
        title="Host a server"
        intro="Hosting on Varde means your PC runs the world while you are around, and the group keeps it alive when you are not. This is the whole setup."
      />
      <ul className="flex flex-wrap gap-2">
        {NEED.map((n) => (
          <li key={n}>
            <Chip variant="secondary" size="sm">
              <Chip.Label>{n}</Chip.Label>
            </Chip>
          </li>
        ))}
      </ul>

      <H2>The short version</H2>
      <P>
        Tick each step off as you finish it. If you can install an app and fill
        in one form, you can host.
      </P>
      <DocChecklist
        title="Hosting checklist"
        items={[
          "Install Varde and approve this PC",
          "Create your group in the dashboard",
          "Create a server: pick the game and name it",
          "Send friends the invite link",
          "Keep Varde running so the server stays reachable",
        ]}
      />

      <H2>Step by step</H2>
      <Steps>
        <Step n={1} title="Install Varde and link this PC">
          Download <Link href="/download">VardeSetup.exe</Link> and install it,
          then approve the PC in the browser window Varde opens. It is the same
          install your friends do, so the{" "}
          <Link href="/docs/join-a-server">join guide</Link> walks through every
          click if you want the detail.
          <Callout tone="warn" title="If Windows warns you">
            The installer is not signed yet, so SmartScreen may show a blue
            warning box. Click{" "}
            <strong className="text-foreground">More info</strong>, then{" "}
            <strong className="text-foreground">Run anyway</strong>.
          </Callout>
        </Step>
        <Step n={2} title="Create your group">
          The first time you open the dashboard it asks you to create or join a
          group. A group is you and your friends: machines and servers belong
          to it, so anyone&rsquo;s PC can host. Name it whatever you like, for
          example <strong className="text-foreground">Friday crew</strong>, and
          press <strong className="text-foreground">Create group</strong>.
        </Step>
        <Step n={3} title="Create a server">
          Press <strong className="text-foreground">New server</strong> in the
          dashboard. Pick the game (Minecraft or Valheim today; each card shows
          the memory it needs), give the server a name, and leave{" "}
          <strong className="text-foreground">Start now</strong> on. Press{" "}
          <strong className="text-foreground">Create server</strong> and Varde
          starts it on a machine in the group, yours by default.
          <CreateServerMock />
        </Step>
        <Step n={4} title="Send friends the invite">
          On the dashboard&rsquo;s{" "}
          <strong className="text-foreground">Members</strong> page, press{" "}
          <strong className="text-foreground">Invite friends</strong> and copy
          the link it makes. Send that to your friends however you like. They
          install Varde, paste the link, and they are in. The{" "}
          <Link href="/docs/join-a-server">join guide</Link> is what they see.
          <InviteCardMock />
        </Step>
        <Step n={5} title="Keep Varde running">
          While your PC hosts, the tray icon glows with the ember and the menu
          shows what it is running. Players connect to an address that never
          changes, so nothing breaks when hosting moves.
          <TrayMenuMock hosting />
          <P>
            Close your laptop mid-session and Varde moves the world to another
            machine in the group, save and all. If no machine is free, the
            server sleeps until one comes back.{" "}
            <Link href="/docs/how-varde-works">How Varde works</Link> shows the
            mechanics.
          </P>
        </Step>
      </Steps>

      <Callout tone="glod" title="The short version">
        Create the server once, share the link once. Varde keeps the world
        alive on whichever machine is around.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        Curious what happens under the hood?{" "}
        <Link href="/docs/how-varde-works">How Varde works</Link> visualizes
        peers, relays, and saves. Any word that was new here is in the{" "}
        <Link href="/docs/glossary">glossary</Link>.
      </P>
    </>
  );
}
