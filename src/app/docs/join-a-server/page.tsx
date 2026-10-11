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
import { DocChecklist } from "@/components/docs/doc-checklist";
import { LinkFlowMock } from "@/components/docs/link-flow-mock";
import { SmartScreenMock } from "@/components/docs/smartscreen-mock";
import { TrayMenuMock } from "@/components/docs/tray-menu-mock";

export const metadata: Metadata = {
  title: "Join a friend's server",
  description: "Install Varde, link your machine, and start playing.",
};

const NEED = [
  "A Windows PC",
  "An invite link from your friend",
  "About 5 minutes",
];

export default function JoinAServer() {
  return (
    <>
      <DocTitle
        title="Join a friend&rsquo;s server"
        intro="Someone in your group runs the world. You install Varde, link your PC to the group, and the server shows up in your game like any other."
      />
      <ul className="flex flex-wrap gap-2">
        {NEED.map((n) => (
          <li
            key={n}
            className="rounded-full border border-separator bg-surface px-3 py-1 text-xs text-muted"
          >
            {n}
          </li>
        ))}
      </ul>

      <H2>The short version</H2>
      <P>
        Tick each step off as you finish it. The whole thing is one install and
        two clicks in a browser.
      </P>
      <DocChecklist
        title="Joining checklist"
        items={[
          "Download VardeSetup.exe",
          "Run the installer (Run anyway if Windows warns)",
          "Approve this PC in the browser window Varde opens",
          "Join the group with the invite link",
          "Copy the server address into your game",
        ]}
      />

      <H2>Step by step</H2>
      <Steps>
        <Step n={1} title="Download Varde">
          Varde is a small Windows app. Get the latest{" "}
          <Link href="/download">VardeSetup.exe</Link> from the download page
          (Windows 10 and 11).
        </Step>
        <Step n={2} title="Run the installer">
          Double-click VardeSetup.exe and install it like any other app.
          <Callout tone="warn" title="If Windows warns you">
            Varde is new and not signed yet, so Windows SmartScreen may show a
            blue warning box. That is expected. Click{" "}
            <strong className="text-foreground">More info</strong>, then{" "}
            <strong className="text-foreground">Run anyway</strong>.
          </Callout>
          <SmartScreenMock />
        </Step>
        <Step n={3} title="Link this PC">
          When setup finishes, Varde opens a{" "}
          <strong className="text-foreground">Set up this PC</strong> window.
          Press <strong className="text-foreground">Continue</strong>: your
          browser opens varde.games and the window shows a short code. In the
          browser, approve the matching code (signing up first if it asks).
          Approving is how Varde knows this PC is really yours.
          <LinkFlowMock />
        </Step>
        <Step n={4} title="Join the group">
          Your friend sends you an invite link from their dashboard. In your
          own dashboard, paste it under{" "}
          <strong className="text-foreground">
            Join your friends&rsquo; group
          </strong>{" "}
          and press <strong className="text-foreground">Join group</strong>. The
          full link works, and so does just the code at the end of it.
        </Step>
        <Step n={5} title="Copy the address and play">
          Open the server in your dashboard and copy its{" "}
          <strong className="text-foreground">address</strong>. It looks like
          127.77.4.20, a special address that only exists while Varde runs on
          your PC. In Minecraft, add it under Multiplayer. In Valheim, the
          dashboard shows either an address or a join code, depending on the
          server.
        </Step>
      </Steps>

      <H2>Varde lives in your tray</H2>
      <P>
        After linking, Varde sits in the system tray next to the clock. Right
        click the icon for its menu; it keeps running when you close the
        window.
      </P>
      <TrayMenuMock />

      <Callout tone="glod" title="The short version">
        Install, approve the code, paste the invite. About five minutes and you
        are in the world.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        Want to run a world for the group instead? Follow the{" "}
        <Link href="/docs/host-a-server">host guide</Link>. Something not
        working? Check{" "}
        <Link href="/docs/troubleshooting">troubleshooting</Link>.
      </P>
    </>
  );
}
