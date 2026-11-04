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

const title = "How to host a CS2 tournament for free";
const description =
  "Set up a CS2 tournament through the Varde desktop app using Auto Tournament and Ready Up. Run the required services on PCs you own.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/docs/cs2-tournament" },
  openGraph: {
    title,
    description,
    url: "/docs/cs2-tournament",
    type: "article",
  },
};

export default function Cs2Tournament() {
  return (
    <>
      <DocTitle
        title={title}
        intro="Use the Varde desktop app to configure your group, create a CS2 server, and run matches with Auto Tournament and Ready Up."
      />

      <Callout title="Availability">
        This desktop app flow needs a Varde release that has not shipped yet.
        Ready Up is in beta.
      </Callout>

      <H2>Set it up</H2>
      <Steps>
        <Step n={1} title="What you need">
          <ul className="my-2 list-disc space-y-1 pl-5">
            <li>
              A Linux PC in your group for Auto Tournament and the CS2 server.
              Ready Up also needs Linux. They can run on the same PC if it has
              enough resources.
            </li>
            <li>
              CS2 installed through Steam, or about 69 GB to download with a
              75 GB disk budget for SteamCMD. Allow at least 4 GB of free memory
              per server.
            </li>
            <li>The Varde desktop app.</li>
          </ul>
        </Step>
        <Step n={2} title="Set up your Linux PC in Varde">
          Install and open the Varde desktop app. Select{" "}
          <strong className="text-foreground">Set up this PC</strong>, then
          select <strong className="text-foreground">Log in with Varde</strong>.
          Complete sign-in to link the Linux PC to your group.
        </Step>
        <Step n={3} title="Start Auto Tournament in Varde">
          In the app, open <strong className="text-foreground">Servers</strong>{" "}
          and find the <strong className="text-foreground">Set up plugins</strong>{" "}
          card. Select <strong className="text-foreground">Set up</strong> for
          Auto Tournament, then choose:
          <ul className="my-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">
                Hosting
              </strong>: {" "}
              <strong className="text-foreground">Run it on one of our PCs</strong>.
            </li>
            <li>
              <strong className="text-foreground">
                Ready Up licence
              </strong>: noncommercial or commercial. This choice applies to both
              Auto Tournament and Ready Up.
            </li>
            <li>
              Optionally, a <strong className="text-foreground">Steam Web API key</strong>.
              This lets players sign in with Steam for map veto. Get one at{" "}
              <Link href="https://steamcommunity.com/dev/apikey">Steam&rsquo;s API key page</Link>.
            </li>
          </ul>
          Select <strong className="text-foreground">Enable and start</strong>.
          Varde downloads and runs Auto Tournament on one of your group&rsquo;s
          Linux PCs. When it is ready, the app shows a public HTTPS address and
          an admin setup code. Open that address and use the code once to create
          your administrator account.
          <p className="mt-2">
            Varde backs up Auto Tournament state like game saves. If that PC
            goes offline, the server and its saved state move to another
            available Linux PC in the group.
          </p>
        </Step>
        <Step n={4} title="Create the CS2 server">
          Open <strong className="text-foreground">Servers</strong> and select{" "}
          <strong className="text-foreground">New server</strong>. Choose{" "}
          <strong className="text-foreground">
            Counter-Strike 2 Dedicated
          </strong>
          , then create the server. The Auto Tournament plugin adds Ready Up
          automatically. Varde applies addon changes when the server starts,
          so restart it if Ready Up was added after it was already running.
        </Step>
        <Step n={5} title="Link Steam and create the tournament">
          Each player opens <strong className="text-foreground">Settings</strong>{" "}
          in the Varde app and selects{" "}
          <strong className="text-foreground">Sign in through Steam</strong>.
          When the players are linked, open{" "}
          <strong className="text-foreground">Tournaments</strong> and select{" "}
          <strong className="text-foreground">Create tournament</strong>. Fill
          in <strong className="text-foreground">Tournament name</strong>,{" "}
          <strong className="text-foreground">Format</strong>,{" "}
          <strong className="text-foreground">Players per team</strong>,{" "}
          <strong className="text-foreground">Map pool</strong>, and{" "}
          <strong className="text-foreground">Players</strong>. The Players
          field is optional. If left empty, the plugin uses group members who
          have linked Steam.
        </Step>
        <Step n={6} title="Connect and ready up">
          Join the server using its address from the Varde app. When a match
          starts, type <Code>.r</Code> in CS2 chat to ready up.
        </Step>
      </Steps>

      <H2>Already have Auto Tournament?</H2>
      <P>
        In <strong className="text-foreground">Hosting</strong>, choose{" "}
        <strong className="text-foreground">I already have Auto Tournament</strong>.
        Enter your <strong className="text-foreground">Auto Tournament address</strong>{" "}
        and <strong className="text-foreground">Auto Tournament API token</strong>,
        then pick the <strong className="text-foreground">Ready Up licence</strong>{" "}
        and select <strong className="text-foreground">Enable plugin</strong>.
        Create the token in Auto Tournament under Settings, API tokens.
        You remain responsible for running and backing up that installation.
      </P>

      <H2>Troubleshooting</H2>
      <Steps>
        <Step n={1} title="Ready Up is not in Auto Tournament">
          Varde applies addon changes when a server starts. Restart the server
          after Ready Up is added, then run <Code>ru selftest</Code> in the CS2
          server console and look for <Code>PASS</Code>.
        </Step>
        <Step n={2} title="The server is on a Windows PC">
          Ready Up runs only on Linux, and Varde places tournament servers
          only on Linux PCs. A tournament server cannot run on a Windows PC.
        </Step>
        <Step n={3} title="There is no Linux PC available">
          Varde cannot start Auto Tournament or the CS2 tournament server until a Linux PC is linked
          to the group and available to host it.
        </Step>
        <Step n={4} title="A player cannot be selected">
          Players need to link Steam in the Varde app. Open{" "}
          <strong className="text-foreground">Settings</strong> and select{" "}
          <strong className="text-foreground">Sign in through Steam</strong>,
          then try again.
        </Step>
      </Steps>

      <Callout title="What free means">
        There is no server rental or subscription for qualifying noncommercial
        events, but you still supply the PCs, power, and upload bandwidth.
        Auto Tournament and Ready Up use the PolyForm Noncommercial License
        1.0.0. Their source is public, but they are not open source under the
        OSI definition. They are free when nobody earns money from the event:
        entry fees and sponsor money go back into the event, and no organizer,
        volunteer, or helper is paid or takes profit. Charities, schools,
        universities, public research, public safety and health organizations,
        and government bodies may use them for free even when charging entry.
        Profit-making events, businesses, paid hosting for others, and paid
        setup or operation need a commercial license. See the{" "}
        <Link href="https://docs.autotournament.gg/reference/licensing">
          Auto Tournament licensing terms
        </Link>
        . Varde itself is open source under the AGPL.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        See the <Link href="/docs/auto-tournament">Auto Tournament plugin guide</Link>,{" "}
        <Link href="/docs/cs2-server">CS2 server setup guide</Link>, and{" "}
        <Link href="/docs/plugins">Varde plugins</Link>.
      </P>
    </>
  );
}
