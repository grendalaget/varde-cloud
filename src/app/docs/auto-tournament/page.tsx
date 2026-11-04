import type { Metadata } from "next";
import Link from "next/link";

import {
  Callout,
  Code,
  CodeBlock,
  DocTitle,
  H2,
  P,
} from "@/components/docs-primitives";

const title = "Auto Tournament plugin";
const description =
  "Configure Auto Tournament and a Ready Up licence for a Varde group, then learn how the integration reconciles its CS2 servers.";

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
        intro="Use the Varde desktop app to connect a group to a self-hosted Auto Tournament platform. The plugin creates a Ready Up fleet key and maintains Ready Up on supported CS2 servers."
      />

      <Callout tone="warn" title="Availability">
        The desktop plugin setup flow needs a Varde release that has not
        shipped yet.
      </Callout>

      <H2>Set up Auto Tournament for a group</H2>
      <P>
        Open the Varde desktop app and select{" "}
        <strong className="text-foreground">Servers</strong>. In the{" "}
        <strong className="text-foreground">Set up plugins</strong> card,
        select <strong className="text-foreground">Set up</strong> for Auto
        Tournament. Fill in these fields:
      </P>
      <ul className="my-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-muted">
        <li>
          <strong className="text-foreground">Auto Tournament address</strong>:
          the address players use to open your Auto Tournament site.
        </li>
        <li>
          <strong className="text-foreground">Auto Tournament API token</strong>:
          create one in Auto Tournament under Settings, API tokens.
        </li>
        <li>
          <strong className="text-foreground">Ready Up licence</strong>: choose
          the licence for this group. Use noncommercial for free events. Paid
          entry, prize money from sponsors or paid hosting needs a commercial
          licence from Auto Tournament.
        </li>
      </ul>
      <P>
        Select <strong className="text-foreground">Enable plugin</strong>. To
        change the values later, select{" "}
        <strong className="text-foreground">Save plugin settings</strong>. The
        plugin validates the API token and creates a Ready Up fleet key named{" "}
        <Code>varde-&lt;group-id&gt;</Code>. The generated{" "}
        <Code>fleet_key</Code> and <Code>fleet_key_url</Code> settings are
        hidden. Changing the Auto Tournament address creates a new fleet key
        for the new Auto Tournament installation.
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

      <H2>How reconciliation works</H2>
      <P>
        The plugin checks group settings when its service starts, after
        settings change, every five minutes, and when a server is created. It
        keeps the group&rsquo;s fleet key and Ready Up addon in sync with those
        settings. Ready Up runs only on Linux, so Varde places tournament
        servers only on Linux PCs. Addon changes take effect at the next
        server start, not immediately.
      </P>

      <Callout title="Licensing">
        Auto Tournament and Ready Up use the PolyForm Noncommercial License
        1.0.0. Commercial use requires a paid license. Read the{" "}
        <Link href="https://docs.autotournament.gg/reference/licensing">
          licensing terms
        </Link>{" "}
        before running an event.
      </Callout>

      <H2>Advanced: run the plugin yourself</H2>
      <P>
        Operators can build the service from the{" "}
        <Link href="https://github.com/grendalaget/varde-plugin-autotournament">
          varde-plugin-autotournament repository
        </Link>
        , configure its manifest, and load it with{" "}
        <Code>--plugin /path/manifest.json</Code> or{" "}
        <Code>VARDE_PLUGINS</Code>. The service uses a group-bound token named{" "}
        <Code>plugin-autotournament</Code>. For more about manifest fields and
        signed requests, see the{" "}
        <Link href="/docs/build-a-plugin">plugin tutorial</Link>.
      </P>
      <CodeBlock
        language="shell"
        code="go build -o varde-plugin-autotournament ./cmd/varde-plugin-autotournament"
      />

      <div className="my-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-separator text-foreground">
              <th className="p-3">Variable</th>
              <th className="p-3">Purpose</th>
            </tr>
          </thead>
          <tbody className="text-muted">
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>VARDE_PLUGIN_SECRET</Code>
              </td>
              <td className="p-3">
                At least 32 bytes and stable. The plugin derives its encryption
                key from it.
              </td>
            </tr>
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>VARDE_URL</Code>
              </td>
              <td className="p-3">The Varde control plane URL.</td>
            </tr>
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>VARDE_SERVICE_TOKEN</Code>
              </td>
              <td className="p-3">
                A service token tied to the group, named{" "}
                <Code>plugin-autotournament</Code>, with <Code>members</Code>,{" "}
                <Code>steam_ids</Code>, <Code>servers</Code>,{" "}
                <Code>server_addons</Code>, and <Code>events</Code> scopes.
              </td>
            </tr>
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>STATE_DIR</Code>
              </td>
              <td className="p-3">
                Persistent and private. It stores encrypted group state. Back
                it up with <Code>VARDE_PLUGIN_SECRET</Code>.
              </td>
            </tr>
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>LISTEN</Code>
              </td>
              <td className="p-3">
                Defaults to <Code>127.0.0.1:7310</Code>. Use loopback or a
                trusted network.
              </td>
            </tr>
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>READYUP_URL</Code>, <Code>READYUP_SHA256</Code>
              </td>
              <td className="p-3">
                Pin the Ready Up archive and its lowercase SHA-256 digest. The
                cookbook includes a release example.
              </td>
            </tr>
            <tr className="border-b border-separator">
              <td className="p-3 align-top">
                <Code>READYUP_LICENSE</Code>
              </td>
              <td className="p-3">
                Ignored by the current service. Set{" "}
                <strong className="text-foreground">Ready Up licence</strong>{" "}
                separately for each group in the Varde app.
              </td>
            </tr>
            <tr>
              <td className="p-3 align-top">
                <Code>AT_ALLOW_PRIVATE</Code>
              </td>
              <td className="p-3">
                Defaults to false. Set it to true only for a private HTTP Auto
                Tournament endpoint. The plugin then sets{" "}
                <Code>insecure = 1</Code> in <Code>fleet.cfg</Code>, so the
                enrollment key travels unencrypted. Use HTTPS outside a
                trusted LAN.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <P>
        The manifest uses <Code>secret_env</Code> for{" "}
        <Code>VARDE_PLUGIN_SECRET</Code> and sets{" "}
        <Code>service_token</Code> to <Code>plugin-autotournament</Code>. Bind
        that service token to the group where the plugin is enabled. Keep the
        plugin service on a trusted network because the control plane calls its
        configured <Code>base_url</Code>.
      </P>

      <H2>Addon behavior and safety</H2>
      <P>
        Varde rebuilds a separate game folder each time it starts a server,
        copies the CS2 executable there, and links the remaining install files.
        Addon files go into that folder, not the shared CS2 install. CS2 itself
        still writes <Code>steam_appid.txt</Code> in the shared install. Files
        in the folder survive automatic restarts after a crash, so Ready Up can
        recover a match. Choose the group&rsquo;s{" "}
        <strong className="text-foreground">Ready Up licence</strong> in the
        Varde app instead of editing the server folder on the host.
      </P>
      <Callout title="Addon safety">
        Ready Up is native code that runs inside the CS2 server, so only enable
        plugins you trust. Addons can add files to the separate folder for that
        server but cannot replace existing files or configs. If an addon tries
        to replace a file, server start fails with{" "}
        <Code>{"cs2: addon <plugin>/<addon> would replace <path>"}</Code>.
      </Callout>

      <P>
        Follow the <Link href="/docs/cs2-tournament">CS2 tournament guide</Link>{" "}
        for the app setup flow, or read the{" "}
        <Link href="/docs/plugins">Varde plugin guide</Link>.
      </P>
    </>
  );
}
