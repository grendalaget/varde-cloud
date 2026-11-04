import type { Metadata } from "next";
import Link from "next/link";

import {
  Callout,
  Code,
  DocTitle,
  H2,
  P,
} from "@/components/docs-primitives";

const title = "Auto Tournament plugin";
const description =
  "Run Auto Tournament on a Linux PC in your Varde group, choose a Ready Up licence, and organise CS2 tournaments.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/docs/auto-tournament" },
  openGraph: {
    title,
    description,
    url: "/docs/auto-tournament",
    type: "article",
  },
};

export default function AutoTournamentPlugin() {
  return (
    <>
      <DocTitle
        title={title}
        intro="Use Varde to run Auto Tournament on one of your PCs. The plugin adds Ready Up to your CS2 servers so you can organise matches from the app."
      />

      <Callout tone="warn" title="Availability">
        The desktop plugin setup flow needs a Varde release that has not
        shipped yet.
      </Callout>

      <H2>Set up Auto Tournament for a group</H2>
      <P>
        You need a Linux PC in your group, just as you do for CS2 servers with
        Ready Up. Auto Tournament and your CS2 servers can use the same PC if it
        has enough resources. Link the PC to your group in Varde before starting.
      </P>
      <P>
        Open the Varde desktop app and select{" "}
        <strong className="text-foreground">Servers</strong>. In the{" "}
        <strong className="text-foreground">Set up plugins</strong> card,
        select <strong className="text-foreground">Set up</strong> for Auto
        Tournament. Choose these settings:
      </P>
      <ul className="my-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted">
        <li>
          <strong className="text-foreground">Hosting</strong>: leave{" "}
          <strong className="text-foreground">Run it on one of our PCs</strong>{" "}
          selected.
        </li>
        <li>
          <strong className="text-foreground">Ready Up licence</strong>: choose
          noncommercial or commercial. This choice applies to both Auto
          Tournament and Ready Up. Check the licensing terms below for your event.
        </li>
        <li>
          <strong className="text-foreground">Steam Web API key</strong>:
          optional. It lets players sign in with Steam for map veto. Get one at{" "}
          <Link className="text-glod underline" href="https://steamcommunity.com/dev/apikey">
            Steam&rsquo;s API key page
          </Link>.
        </li>
      </ul>
      <P>
        Select <strong className="text-foreground">Enable and start</strong>.
        Varde downloads and runs Auto Tournament on one of the group&rsquo;s Linux
        PCs. When it is ready, the app shows a public HTTPS address and an admin
        setup code. Open that address and use the code once to create your
        administrator account. You do not need to enter an address or API token
        when Varde runs it for you.
      </P>
      <P>
        Varde backs up Auto Tournament state like game saves. If its PC goes
        offline, the server and its saved state move to another available Linux
        PC in the group. You do not need to set it up again.
      </P>

      <H2>Already have Auto Tournament?</H2>
      <P>
        Choose <strong className="text-foreground">I already have Auto Tournament</strong>{" "}
        under <strong className="text-foreground">Hosting</strong>. The{" "}
        <strong className="text-foreground">Auto Tournament address</strong> and{" "}
        <strong className="text-foreground">Auto Tournament API token</strong>{" "}
        fields appear. Enter the address players use and a token created in
        Auto Tournament under Settings, API tokens. Pick your{" "}
        <strong className="text-foreground">Ready Up licence</strong> and select{" "}
        <strong className="text-foreground">Enable plugin</strong>. You remain
        responsible for running and backing up that installation.
      </P>

      <H2>Use the Tournaments page</H2>
      <P>
        After the plugin is enabled, open{" "}
        <strong className="text-foreground">Tournaments</strong> and select{" "}
        <strong className="text-foreground">Create tournament</strong>. The
        form has <strong className="text-foreground">Tournament name</strong>,{" "}
        <strong className="text-foreground">Format</strong>,{" "}
        <strong className="text-foreground">Players per team</strong>,{" "}
        <strong className="text-foreground">Map pool</strong>, and{" "}
        <strong className="text-foreground">Players</strong> fields. The team
        size defaults to 5. The map pool includes <Code>de_mirage</Code>,{" "}
        <Code>de_inferno</Code>, and <Code>de_nuke</Code>.
      </P>
      <P>
        Players must link Steam in the Varde app. Open{" "}
        <strong className="text-foreground">Settings</strong> and select{" "}
        <strong className="text-foreground">Sign in through Steam</strong>.
        The Players field is optional. If it is empty, the plugin uses group
        members with linked Steam and skips the rest. At least two teams&rsquo;
        worth of eligible players are needed.
      </P>
      <P>
        Ready Up links CS2 servers to Auto Tournament. Matches are assigned to
        linked servers, and Ready Up reports match state and results back to
        the platform.
      </P>

      <H2>CS2 servers and Ready Up</H2>
      <P>
        The plugin adds Ready Up to your group&rsquo;s CS2 servers automatically.
        Ready Up runs only on Linux, so tournament servers need a Linux PC in
        the group. Addon changes take effect at the next server start. Restart
        a server if it was already running when Ready Up was added.
      </P>

      <Callout title="Licensing">
        Auto Tournament and Ready Up use the PolyForm Noncommercial License
        1.0.0. Commercial use requires a paid license. Read the{" "}
        <Link href="https://docs.autotournament.gg/reference/licensing">
          licensing terms
        </Link>{" "}
        before running an event.
      </Callout>

      <Callout title="Addon safety">
        Ready Up is native code that runs inside the CS2 server, so only enable
        plugins you trust.
      </Callout>

      <P>
        Follow the <Link href="/docs/cs2-tournament">CS2 tournament guide</Link>{" "}
        for the app setup flow, or read the{" "}
        <Link href="/docs/plugins">Varde plugin guide</Link>.
      </P>
    </>
  );
}
