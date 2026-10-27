import { Chip } from "@heroui/react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Callout,
  Code,
  DocTitle,
  H2,
  P,
  Step,
  Steps,
} from "@/components/docs-primitives";
import { DocChecklist } from "@/components/docs/doc-checklist";

export const metadata: Metadata = {
  title: "Host a free CS2 server for your friends",
  description:
    "Host a free Counter-Strike 2 server on your Windows or Linux PC. Reuse Steam, invite friends, and connect through Varde without renting or opening ports.",
  alternates: { canonical: "/docs/cs2-server" },
  openGraph: {
    title: "Host a free CS2 server for your friends",
    description:
      "Host a free Counter-Strike 2 server on your Windows or Linux PC. Reuse Steam, invite friends, and connect through Varde without renting or opening ports.",
    url: "/docs/cs2-server",
    type: "article",
  },
};

const NEED = [
  "Windows or Linux x86_64 PC",
  "4 GB free memory",
  "CS2 installed through Steam",
  "Varde",
];

export default function Cs2Server() {
  return (
    <>
      <DocTitle
        title="Host a Counter-Strike 2 server for your friends"
        intro="Run a CS2 dedicated server from a PC your group already owns. Varde keeps the connection private and moves hosting to another group PC when needed."
      />
      <ul className="flex flex-wrap gap-2">
        {NEED.map((item) => (
          <li key={item}>
            <Chip variant="secondary" size="sm">
              <Chip.Label>{item}</Chip.Label>
            </Chip>
          </li>
        ))}
      </ul>

      <H2>The short version</H2>
      <P>
        Counter-Strike 2 is free to play, and Varde is open source under the
        AGPL. The server runs on your PC or a friend&rsquo;s PC, so there is no
        rented server and no port forwarding.
      </P>
      <DocChecklist
        title="CS2 hosting checklist"
        items={[
          "Install Varde and link the PC to your group",
          "Create a group if you do not have one yet",
          "Create a Counter-Strike 2 Dedicated server",
          "Invite friends from the Members page",
          "Keep Varde running on each player PC",
        ]}
      />

      <H2>Step by step</H2>
      <Steps>
        <Step n={1} title="Install Varde and link the PC">
          Install Varde, then approve the PC in the browser window it opens.
          The <Link href="/docs/join-a-server">join guide</Link> walks through
          installing Varde and linking a PC.
        </Step>
        <Step n={2} title="Create a group">
          Open the dashboard and create a group for the people who will play.
          If you already have a group, use it.
        </Step>
        <Step n={3} title="Create the CS2 server">
          Select <strong className="text-foreground">New server</strong>, pick{" "}
          <strong className="text-foreground">
            Counter-Strike 2 Dedicated
          </strong>
          , set a server name, leave{" "}
          <strong className="text-foreground">Start now</strong> on, then
          select <strong className="text-foreground">Create server</strong>.
          On a PC with CS2 installed, the server is usually ready in about 10
          seconds. See{" "}
          <Link href="/docs/cs2-server-settings">CS2 server settings</Link> for
          modes, maps, passwords, bots, and GSLT.
        </Step>
        <Step n={4} title="Invite your friends">
          On the dashboard&rsquo;s <strong className="text-foreground">Members</strong>{" "}
          page, select <strong className="text-foreground">Invite friends</strong>{" "}
          and send them the link. They need Varde running on their PC to connect.
        </Step>
        <Step n={5} title="Connect from CS2">
          Copy the server address from the dashboard. In Counter-Strike 2, go
          to <strong className="text-foreground">Settings</strong>,{" "}
          <strong className="text-foreground">Game</strong>, turn on{" "}
          <strong className="text-foreground">Enable Developer Console</strong>,
          then press the console key. Enter{" "}
          <Code>connect &lt;address&gt;</Code>, using the address exactly as
          shown. If the dashboard includes port <Code>27015</Code>, keep it in
          the address.
        </Step>
      </Steps>

      <H2>Requirements and downloads</H2>
      <P>
        The host needs a Windows or Linux x86_64 PC, at least 4 GB of free
        memory, and CS2 installed through Steam. macOS is not supported for
        hosting CS2. Varde runs the server from the CS2 you already installed,
        with no second download. Your own configs and game files stay as they
        are; Varde only adds a temporary server config while the server runs,
        and CS2 itself may write its usual small files such as{" "}
        <Code>steam_appid.txt</Code>.
      </P>
      <P>
        Varde can run several CS2 servers from one Steam install. Without a
        Steam install, it can download the dedicated server with SteamCMD,
        which needs about 69 GB to download and a 75 GB disk budget.
      </P>
      <Callout tone="warn" title="Keep Windows Firewall on">
        Varde adds per-server rules that keep CS2&rsquo;s private ports off the
        network. CS2 will not start through Varde if Windows Firewall is off.
        You do not need to open ports on your router.
      </Callout>

      <Callout tone="glod" title="The short version">
        Use the CS2 install already on a Windows or Linux PC, create the server
        in your group, and share its dashboard address with friends.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        Adjust modes, maps, bots, and passwords in{" "}
        <Link href="/docs/cs2-server-settings">CS2 server settings</Link>. For
        tournaments, see{" "}
        <Link href="/docs/cs2-tournament">How to host a CS2 tournament</Link>.
        For general setup, see the{" "}
        <Link href="/docs/host-a-server">host guide</Link> and{" "}
        <Link href="/docs/join-a-server">join guide</Link>.
      </P>
    </>
  );
}
