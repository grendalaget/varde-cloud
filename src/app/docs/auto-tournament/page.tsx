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
  "Connect a self-hosted Auto Tournament instance and Ready Up to a Varde group. Configure the plugin, its service token, and Linux CS2 addon.";

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
        intro="The Varde Auto Tournament plugin connects a group to a self-hosted Auto Tournament platform. It creates a fleet key, installs Ready Up on supported CS2 servers, and adds tournament actions to the group."
      />

      <P>
        For the full player setup, see{" "}
        <Link href="/docs/cs2-tournament">How to host a CS2 tournament for free</Link>.
      </P>

      <H2>For group owners</H2>
      <P>
        Open the group&rsquo;s plugin settings, enter <Code>at_url</Code> and
        the Auto Tournament admin API token in <Code>at_token</Code>, then
        enable the plugin. The plugin checks the token and creates a Ready Up
        fleet key named{" "}
        <Code>varde-&lt;group-id&gt;</Code>. The generated{" "}
        <Code>fleet_key</Code> and <Code>fleet_key_url</Code> settings are
        hidden. Changing <Code>at_url</Code> creates a new fleet key on the new
        Auto Tournament installation.
      </P>
      <P>
        The group&rsquo;s <Code>Tournaments</Code> page lists tournaments and
        has a <Code>Create tournament</Code> action. Choose a name, a format
        (shuffle, single elimination, or double elimination), a team size
        (default 5), and maps from <Code>de_mirage</Code>,{" "}
        <Code>de_inferno</Code>, and <Code>de_nuke</Code>. The optional player
        field selects group members with verified Steam IDs. When left empty,
        the plugin includes members with a Steam ID and skips the rest. It
        needs at least two teams&rsquo; worth of eligible players.
      </P>
      <P>
        Ready Up links the CS2 server to Auto Tournament. Matches are assigned
        to linked servers, and Ready Up reports match state and results back to
        the platform.
      </P>

      <H2>For control plane operators</H2>
      <P>
        The plugin is a separate Go service. Build it from the{" "}
        <Link href="https://github.com/grendalaget/varde-plugin-autotournament">
          varde-plugin-autotournament repository
        </Link>
        , configure the manifest, then load it with{" "}
        <Code>--plugin /path/manifest.json</Code> or{" "}
        <Code>VARDE_PLUGINS</Code>.
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
                <Code>steam_ids</Code>,{" "}
                <Code>servers</Code>, <Code>server_addons</Code>, and{" "}
                <Code>events</Code> scopes.
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
                Must be <Code>noncommercial</Code> or <Code>commercial</Code>.
                There is no default.
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

      <H2>How the plugin applies CS2 addons</H2>
      <P>
        The plugin checks and updates its settings when it starts, after group
        settings change, every five minutes, and when a server is created. It
        installs the Ready Up addon on CS2 servers. Varde applies addon
        changes at the next server start, not immediately.
      </P>
      <P>
        CS2 servers with Ready Up are placed only on Linux PCs. Varde rebuilds
        a separate game folder each time it starts the server, copies the CS2
        executable there, and links the remaining install files. Addon files
        go into that folder, not the shared CS2 install. CS2 itself still
        writes <Code>steam_appid.txt</Code> in the shared install. Files in
        the folder survive automatic restarts after a crash, so Ready Up can
        recover a match. Change Ready Up settings through Varde by updating
        the addon instead of editing the folder on the host.
      </P>
      <Callout title="Addon safety">
        Ready Up is native code that runs inside the CS2 server, so only enable
        plugins you trust. Addons can add files to the separate folder for
        that server but cannot replace existing files or configs. If an addon
        tries to replace a file, server start fails with{" "}
        <Code>{"cs2: addon <plugin>/<addon> would replace <path>"}</Code>.
      </Callout>

      <Callout title="Licensing">
        Auto Tournament and Ready Up use the PolyForm Noncommercial License
        1.0.0. Commercial use requires a paid license. Read the{" "}
        <Link href="https://docs.autotournament.gg/reference/licensing">
          licensing terms
        </Link>{" "}
        before running an event.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        Follow the <Link href="/docs/cs2-tournament">CS2 tournament cookbook</Link>{" "}
        or read the <Link href="/docs/plugins">Varde plugin guide</Link>.
      </P>
    </>
  );
}
