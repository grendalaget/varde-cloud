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
  title: "CS2 dedicated server settings: modes, bots, passwords and GSLT",
  description:
    "Configure CS2 modes, maps, player limits, bots, passwords, and GSLT. See Linux setup notes, what moves with a server, and common fixes for dedicated servers.",
  alternates: { canonical: "/docs/cs2-server-settings" },
  openGraph: {
    title: "CS2 dedicated server settings: modes, bots, passwords and GSLT",
    description:
      "Configure CS2 modes, maps, player limits, bots, passwords, and GSLT. See Linux setup notes, what moves with a server, and common fixes for dedicated servers.",
    url: "/docs/cs2-server-settings",
    type: "article",
  },
};

const NEED = [
  "A CS2 server in your group",
  "A group owner or operator",
  "About 5 minutes",
];

export default function Cs2ServerSettings() {
  return (
    <>
      <DocTitle
        title="CS2 dedicated server settings"
        intro="Set the mode, map, player limit, bots, password, and optional Steam login token for your Counter-Strike 2 server."
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
        Edit a server&rsquo;s configuration in the dashboard, then restart the
        server to apply changes. A CS2 server has no save file, but Varde carries
        its ban lists when hosting moves.
      </P>
      <DocChecklist
        title="Settings checklist"
        items={[
          "Choose a mode and map",
          "Set the player limit and bot quota",
          "Add a password or GSLT if you need one",
          "Restart the server after changing settings",
        ]}
      />

      <H2>Server settings</H2>
      <ul className="my-5 space-y-4 pl-5 text-muted">
        <li>
          <strong className="text-foreground">
            <Code>server_name</Code>
          </strong>{" "}
          is required. It is the name players see in the server.
        </li>
        <li>
          <strong className="text-foreground">
            <Code>password</Code>
          </strong>{" "}
          is optional. It is stored as a secret setting.
        </li>
        <li>
          <strong className="text-foreground">
            <Code>game_mode</Code>
          </strong>{" "}
          accepts <Code>casual</Code>, <Code>competitive</Code>,{" "}
          <Code>wingman</Code>, <Code>arms_race</Code>, and{" "}
          <Code>deathmatch</Code>. The default is <Code>competitive</Code>.
        </li>
        <li>
          <strong className="text-foreground">
            <Code>map</Code>
          </strong>{" "}
          defaults to <Code>de_dust2</Code>. Any map name can be entered.
          Stock maps include <Code>de_mirage</Code>, <Code>de_inferno</Code>,
          and <Code>de_nuke</Code>.
        </li>
        <li>
          <strong className="text-foreground">
            <Code>max_players</Code>
          </strong>{" "}
          defaults to 10 and accepts 2 to 64 players.
        </li>
        <li>
          <strong className="text-foreground">
            <Code>bots</Code>
          </strong>{" "}
          defaults to 0 and accepts 0 to 64. A positive quota follows CS2&rsquo;s
          player-join and hibernation policy, so an empty server&rsquo;s bot
          count may not immediately match the quota.
        </li>
        <li>
          <strong className="text-foreground">
            <Code>gslt</Code>
          </strong>{" "}
          is an optional Steam Game Server Login Token. Create one for app 730
          at{" "}
          <Link href="https://steamcommunity.com/dev/managegameservers">
            Steam&rsquo;s Game Server Account Management page
          </Link>
          . Without a token, CS2 reports the server as LAN only. Connections
          through Varde count as local.
        </li>
      </ul>

      <H2>Network access and host moves</H2>
      <P>
        Varde exposes only UDP port <Code>27015</Code> for CS2. RCON and
        SourceTV are not reachable through Varde. CS2 has no save to carry, so
        a match in progress restarts when another PC takes over. Varde does
        carry <Code>banned_user.cfg</Code> and <Code>banned_ip.cfg</Code> to the
        next host.
      </P>

      <H2>What Varde touches in your install</H2>
      <P>
        Varde briefly creates <Code>varde_&lt;server-id&gt;.cfg</Code> while
        launching the server and removes it after healthy startup, leaves the
        empty <Code>.varde_&lt;server-id&gt;.cfg.lock</Code> sidecar behind, and
        never overwrites your existing config or ban files. CS2 creates or rewrites{" "}
        <Code>steam_appid.txt</Code> and rewrites <Code>boot.vcfg</Code> without
        changing its contents.
      </P>

      <H2>Linux host notes</H2>
      <P>
        The packaged Linux service runs as user <Code>varde</Code> with{" "}
        <Code>ProtectHome</Code>, so it cannot read a Steam install inside your
        home folder by default. Run the agent as your desktop user, or have an
        administrator expose the Steam libraries read only and set{" "}
        <Code>VARDE_CS2_DIR</Code> to the CS2 install or{" "}
        <Code>VARDE_STEAM_DIR</Code> to an additional Steam root.
      </P>
      <P>
        Varde checks common Steam locations including{" "}
        <Code>~/.local/share/Steam</Code>, <Code>~/.steam/steam</Code>, and
        Steam&rsquo;s Flatpak library at{" "}
        <Code>~/.var/app/com.valvesoftware.Steam/.local/share/Steam</Code>.
      </P>

      <H2>Troubleshooting</H2>
      <Steps>
        <Step n={1} title="The server stays starting or changes to failed">
          On Windows, confirm Windows Firewall is on. Check that CS2 is
          installed through Steam and that Varde can find its install. Confirm
          the host has at least 4 GB of free memory. Without a Steam install,
          allow for the SteamCMD download and its disk budget.
        </Step>
        <Step n={2} title="A friend cannot connect">
          Varde must be running on the player&rsquo;s PC. Copy the current
          address from the dashboard and use it exactly, including port
          <Code>27015</Code> if it is shown.
        </Step>
        <Step n={3} title="CS2 says the server is LAN only">
          Add a Steam Game Server Login Token for app 730 in{" "}
          <Code>gslt</Code>, then restart the server. Without a token, CS2
          reports LAN only even though connections through Varde count as local.
        </Step>
      </Steps>

      <Callout tone="glod" title="The short version">
        Set the values you want, then restart the server. Varde carries ban
        lists when hosting moves, but an active match starts again on the next
        host.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        Start with the <Link href="/docs/cs2-server">CS2 hosting guide</Link>,
        see the general <Link href="/docs/host-a-server">host guide</Link>, or
        learn about the <Link href="/docs/plugins">plugin system</Link>.
      </P>
    </>
  );
}
