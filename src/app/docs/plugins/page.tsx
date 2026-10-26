import { Chip } from "@heroui/react";
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

export const metadata: Metadata = {
  title: "Varde plugins: add integrations to your group",
  description:
    "Enable Varde plugins for your group, then learn what self-hosted operators configure for plugin secrets, service tokens, and trusted network access.",
  alternates: { canonical: "/docs/plugins" },
  openGraph: {
    title: "Varde plugins: add integrations to your group",
    description:
      "Enable Varde plugins for your group, then learn what self-hosted operators configure for plugin secrets, service tokens, and trusted network access.",
    url: "/docs/plugins",
    type: "article",
  },
};

const NEED = ["A self-hosted control plane", "A group owner", "An operator"];

export default function Plugins() {
  return (
    <>
      <DocTitle
        title="Varde plugins for group integrations"
        intro="Plugins add integrations to a Varde group through a separately hosted HTTP service. The control plane describes its settings and pages, then draws them with the native Varde interface."
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
        Plugins are installed by the person running the control plane. The
        hosted control plane at varde.games does not load third-party plugins,
        so plugins are for self-hosted Varde today. Plugins do not run
        JavaScript in a Varde user&rsquo;s browser session.
      </P>
      <DocChecklist
        title="Plugin setup checklist"
        items={[
          "An operator loads the plugin manifest and secret",
          "A group owner fills out the plugin settings",
          "The group owner selects Enable plugin",
          "Plugin pages appear in the dashboard navigation",
        ]}
      />

      <H2>For group owners</H2>
      <Steps>
        <Step n={1} title="Open plugin settings">
          In the group dashboard, open <strong className="text-foreground">Settings</strong>{" "}
          and find the <strong className="text-foreground">Plugins</strong>{" "}
          card. It appears when the control plane operator has installed at
          least one plugin.
        </Step>
        <Step n={2} title="Set values and enable the plugin">
          Fill in the fields shown in the card, then select{" "}
          <strong className="text-foreground">Enable plugin</strong>. The
          plugin&rsquo;s pages appear in the dashboard navigation. To remove
          it from the group, select <strong className="text-foreground">Disable</strong>.
        </Step>
        <Step n={3} title="Link Steam when a plugin needs it">
          Some plugins need group members&rsquo; Steam IDs. Each member links a
          verified account from <strong className="text-foreground">Settings</strong>{" "}
          with <strong className="text-foreground">Sign in through Steam</strong>.
          You cannot add an ID by typing it.
        </Step>
      </Steps>

      <H2>For control plane operators</H2>
      <P>
        Load one or more manifest files at startup with{" "}
        <Code>--plugin /path/plugin.json</Code>, repeating the option as needed,
        or set <Code>VARDE_PLUGINS</Code> to a comma-separated list. The
        manifest declares an HTTP service, its settings, and the pages Varde
        should draw. Keep each plugin on a trusted network because the control
        plane sends requests to its configured address.
      </P>
      <P>
        Set exactly one of <Code>secret_env</Code> and <Code>secret_file</Code>{" "}
        in the manifest. The resolved signing secret must be at least 32 bytes.
        The control plane uses it to sign requests and does not send the secret
        in the request body.
      </P>
      <P>
        SQLite creates a local secrets key on first startup. For PostgreSQL or
        multiple control plane replicas, set the same base64 encoded 32 byte{" "}
        <Code>VARDE_SECRETS_KEY</Code> on every replica, or configure a shared{" "}
        <Code>--secrets-key-file</Code>. Back the key up with the database.
        Losing it makes saved plugin secrets unreadable.
      </P>
      <P>
        If a plugin calls back into Varde, create a service token named to match
        the manifest&rsquo;s <Code>service_token</Code> value, and bind it to
        the group that enables the plugin. Available scopes are{" "}
        <Code>enroll</Code>, <Code>members</Code>, <Code>nodes</Code>,{" "}
        <Code>servers</Code>, <Code>server_addons</Code>, <Code>events</Code>,{" "}
        <Code>steam_ids</Code>, and <Code>*</Code>.
      </P>
      <CodeBlock
        language="shell"
        code="varde-control-plane service-token create --name <manifest service_token> --scopes members,servers --groups <group-id>"
      />

      <H2>Install the control plane on Linux</H2>
      <P>
        The Linux installer can install just the control plane. Its environment
        file is <Code>/etc/varde/control-plane.env</Code>.
      </P>
      <CodeBlock
        language="shell"
        code="curl -fsSL https://github.com/grendalaget/varde/releases/latest/download/install.sh | sh -s -- --component control-plane"
      />

      <Callout tone="glod" title="The short version">
        Operators install and secure plugin services. Group owners configure
        them in Settings, then use their pages from the normal dashboard
        navigation.
      </Callout>

      <H2>What&rsquo;s next</H2>
      <P>
        Build a service with the{" "}
        <Link href="/docs/build-a-plugin">Varde plugin tutorial</Link>. For
        request details and server addons, see the{" "}
        <Link href="https://github.com/grendalaget/varde/blob/main/docs/plugins.md">
          full plugin reference
        </Link>
        .
      </P>
    </>
  );
}
