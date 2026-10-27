import type { Metadata } from "next";
import Link from "next/link";

import {
  Callout,
  Code,
  CodeBlock,
  DocTitle,
  H2,
  P,
  Step,
  Steps,
} from "@/components/docs-primitives";
import { DocChecklist } from "@/components/docs/doc-checklist";

const title = "How to host a CS2 tournament for free";
const description =
  "Host a Counter-Strike 2 tournament on PCs your group owns with Varde, Auto Tournament, and Ready Up. Run it yourself without renting game servers.";

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
        intro="Run a Counter-Strike 2 tournament on PCs your group already owns. Varde hosts the game servers, Auto Tournament runs the event, and Ready Up manages each match."
      />

      <H2>How the pieces fit</H2>
      <P>
        Auto Tournament is a self-hosted platform for signups, brackets, and map
        veto. Ready Up is its CS2 plugin for ready-ups, knife rounds, and
        pauses. Ready Up sends match state and results back to Auto Tournament.
        The Varde Auto Tournament plugin connects them: it creates the fleet
        key and installs Ready Up on your CS2 servers.
      </P>

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

      <Callout title="Availability">
        This guide uses CS2 addons and plugins in Varde&rsquo;s main branch,
        which are not yet in a release. Ready Up is in beta. The Auto
        Tournament integration is a separate service.
      </Callout>

      <DocChecklist
        title="What you need"
        items={[
          "A Linux x86_64 PC for each CS2 server, with at least 4 GB of free memory per server",
          "CS2 installed through Steam, or about 69 GB for a SteamCMD download",
          "A machine with Docker for Auto Tournament, which can be the same PC",
          "Your own Varde control plane and a linked Linux PC",
          "A Steam account linked in Varde for every tournament player",
        ]}
      />

      <H2>Set it up</H2>
      <Steps>
        <Step n={1} title="Install Auto Tournament">
          Follow the{" "}
          <Link href="https://docs.autotournament.gg/getting-started/install">
            Auto Tournament Docker install guide
          </Link>
          . Save its Compose file and a private <Code>.env</Code> with a
          generated <Code>SESSION_SECRET</Code>, <Code>SERVER_TOKEN</Code>,{" "}
          <Code>DB_PASSWORD</Code>, and a <Code>FRONTEND_BASE_URL</Code> that
          players and servers can reach. Do not use <Code>localhost</Code>{" "}
          unless every client and server is on that same machine.
          <CodeBlock
            language="text"
            code={`# .env
FRONTEND_BASE_URL=https://at.example.com
SESSION_SECRET=<generated secret>
SERVER_TOKEN=<generated token>
DB_PASSWORD=<generated password>

docker compose up -d
docker logs auto-tournament`}
          />
          Enter the one-time setup code from the logs at <Code>/setup</Code>,
          create the admin, and finish sign-in setup. Local username and
          password sign-in works without a Steam API key. A fresh install
          includes only the Manual reporting module, so install the
          Counter-Strike 2 module, then create an admin API token under
          Settings → API tokens. Save the token when it is shown because you
          cannot see it again.
        </Step>
        <Step n={2} title="Run Varde and link the Linux PC">
          Run your own Varde control plane and link the Linux PC that will host
          CS2. The hosted control plane at varde.games does not load plugins.
          See the{" "}
          <Link href="/docs/plugins#for-control-plane-operators">
            plugin operator guide
          </Link>{" "}
          and <Link href="/docs/host-a-server">host a server</Link>.
        </Step>
        <Step n={3} title="Build and run the plugin service">
          Build the{" "}
          <Link href="https://github.com/grendalaget/varde-plugin-autotournament">
            Varde Auto Tournament plugin
          </Link>{" "}
          with Go 1.26 or newer. Give it a stable plugin secret of at least 32
          bytes, the control plane URL, and a service token tied to the group,
          named{" "}
          <Code>plugin-autotournament</Code> with scopes <Code>members</Code>,{" "}
          <Code>steam_ids</Code>, <Code>servers</Code>,{" "}
          <Code>server_addons</Code>, and <Code>events</Code>. Keep{" "}
          <Code>STATE_DIR</Code> persistent and private. Bind{" "}
          <Code>LISTEN</Code> to loopback when services share a host, or to a
          trusted network address.
          <CodeBlock
            language="shell"
            code={`go build -o varde-plugin-autotournament ./cmd/varde-plugin-autotournament
export VARDE_PLUGIN_SECRET="<at least 32 bytes, stable>"
export VARDE_URL="https://varde.example.com"
export VARDE_SERVICE_TOKEN="<group-bound token>"
export STATE_DIR="/var/lib/varde-plugin-autotournament"
export LISTEN="127.0.0.1:7310"
export READYUP_URL="https://github.com/Auto-Tournament/ready-up/releases/download/v0.1.0-beta.77/ready-up-full-0.1.0-beta.77-linuxsteamrt64.zip"
export READYUP_SHA256="b260c55eaff68cf90d09caa95b6311ad0cf1a8919be7c557064b01bdf1ce295e"
export READYUP_LICENSE="noncommercial"`}
          />
          The license must be <Code>noncommercial</Code> or{" "}
          <Code>commercial</Code>; there is no default. Configure the manifest
          with the plugin address, <Code>secret_env</Code>, and{" "}
          <Code>service_token</Code>, then load it with{" "}
          <Code>--plugin /path/manifest.json</Code> or{" "}
          <Code>VARDE_PLUGINS</Code>. See the{" "}
          <Link href="/docs/auto-tournament">plugin operator reference</Link>.
          Set <Code>AT_ALLOW_PRIVATE=true</Code> only when Auto Tournament
          uses a private HTTP URL. Ready Up is native code that runs inside the
          CS2 server, so only enable plugins you trust. Addons can add files to
          the server folder, but cannot replace its configs.
        </Step>
        <Step n={4} title="Enable the plugin for your group">
          In the group&rsquo;s plugin settings, enter the Auto Tournament URL
          and admin API token, then enable the plugin. Its settings are{" "}
          <Code>at_url</Code> and <Code>at_token</Code>. The plugin validates
          the token and creates a Ready Up fleet key named{" "}
          <Code>varde-&lt;group-id&gt;</Code> automatically.
        </Step>
        <Step n={5} title="Create and start a CS2 server">
          <Link href="/docs/cs2-server">Create a CS2 server</Link>. The plugin
          adds Ready Up after the server is created. Addon changes take effect
          at the next start, so start or restart the server. It appears in
          Auto Tournament&rsquo;s server list after Ready Up links. Run{" "}
          <Code>ru selftest</Code> in the server console and look for{" "}
          <Code>PASS</Code>.
        </Step>
        <Step n={6} title="Create the tournament">
          Use the group&rsquo;s <Code>Tournaments</Code> page or create it
          directly in Auto Tournament. The plugin supports shuffle,
          single-elimination, and double-elimination formats. Team size defaults
          to 5. Its map pool is <Code>de_mirage</Code>,{" "}
          <Code>de_inferno</Code>, and <Code>de_nuke</Code>. Players are group
          members with a verified Steam ID; members without one are skipped.
          The plugin needs at least two teams&rsquo; worth of eligible players.
          Auto Tournament assigns matches to linked servers, and Ready Up
          starts each one in warmup.
        </Step>
        <Step n={7} title="Connect and ready up">
          Players should{" "}
          <Link href="/docs/join-a-server">link their PC to Varde</Link>, then
          follow the <Link href="/docs/cs2-server">CS2 connect steps</Link>.
          Type <Code>.r</Code> in chat to ready up.
        </Step>
      </Steps>

      <H2>Troubleshooting</H2>
      <Steps>
        <Step n={1} title="The server is not in Auto Tournament">
          Restart the server after addon changes and run{" "}
          <Code>ru selftest</Code>. The plugin accepts plain HTTP only when{" "}
          <Code>AT_ALLOW_PRIVATE=true</Code>. It then sets{" "}
          <Code>insecure = 1</Code>, so the enrollment key travels unencrypted.
          Use HTTPS outside a trusted LAN.
        </Step>
        <Step n={2} title="The server won&rsquo;t start on a Windows PC">
          Varde places CS2 servers with Ready Up only on Linux PCs. If no Linux
          PC in the group can take the server, it stays unscheduled. The
          scheduler reason ends with <Code>unsupported os windows</Code> and
          has the format <Code>{"<node id>: unsupported os windows"}</Code>.
          Servers without addons can still run on Windows.
        </Step>
        <Step n={3} title="The map or players are rejected">
          The plugin accepts only its three listed maps. Link a verified Steam
          account in Varde for each player, then include at least two full
          teams for the selected team size.
        </Step>
        <Step n={4} title="Change Ready Up settings through Varde">
          Varde rebuilds the server&rsquo;s CS2 folder each time it starts the
          server. Files in the folder survive automatic restarts after a crash,
          so Ready Up can recover a match. Change plugin-managed settings
          through Varde instead of editing the folder on the host.
        </Step>
      </Steps>

      <H2>What&rsquo;s next</H2>
      <P>
        Read the <Link href="/docs/auto-tournament">Auto Tournament plugin
        reference</Link>, configure your{" "}
        <Link href="/docs/cs2-server-settings">CS2 server settings</Link>, or
        learn more about <Link href="/docs/plugins">Varde plugins</Link>.
      </P>
    </>
  );
}
