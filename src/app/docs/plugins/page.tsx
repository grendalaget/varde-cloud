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

export const metadata: Metadata = {
  title: "Varde plugins: add integrations to your group",
  description:
    "Configure catalog plugins in the Varde desktop app, or install them from the web dashboard when you run your own control plane.",
  alternates: { canonical: "/docs/plugins" },
  openGraph: {
    title: "Varde plugins: add integrations to your group",
    description:
      "Configure catalog plugins in the Varde desktop app, or install them from the web dashboard when you run your own control plane.",
    url: "/docs/plugins",
    type: "article",
  },
};

export default function Plugins() {
  return (
    <>
      <DocTitle
        title="Varde plugins for group integrations"
        intro="Plugins add integrations to a Varde group through a separately hosted service. Group owners configure them in the Varde desktop app."
      />
      <Callout tone="warn" title="Availability">
        These setup flows need a Varde release that has not shipped yet.
      </Callout>

      <H2>For group owners</H2>
      <Steps>
        <Step n={1} title="Open the plugin setup form">
          Open the Varde desktop app and select{" "}
          <strong className="text-foreground">Servers</strong>. When the
          control plane operator has installed a catalog plugin, it appears in
          the <strong className="text-foreground">Set up plugins</strong> card.
          Select <strong className="text-foreground">Set up</strong> beside
          that plugin.
        </Step>
        <Step n={2} title="Configure the plugin">
          Fill in the form and select{" "}
          <strong className="text-foreground">Enable plugin</strong>. To
          change the values later, select{" "}
          <strong className="text-foreground">Save plugin settings</strong>.
          The plugin&rsquo;s pages, such as{" "}
          <strong className="text-foreground">Tournaments</strong>, then
          appear in the app sidebar.
        </Step>
      </Steps>

      <h2
        id="for-control-plane-operators"
        className="mb-3 mt-10 text-xl font-semibold text-foreground"
      >
        For control plane operators
      </h2>
      <P>
        The only web UI needed for plugin administration is the dashboard on
        your own control plane, and it is for operators. Group owners use the
        Varde desktop app. On that dashboard, open{" "}
        <strong className="text-foreground">Plugins</strong> and select{" "}
        <strong className="text-foreground">Install</strong> for a catalog
        plugin. The same page has{" "}
        <strong className="text-foreground">Update</strong> and{" "}
        <strong className="text-foreground">Uninstall</strong> actions.
      </P>
      <P>
        Set <Code>VARDE_OPERATORS</Code> to the operator email addresses to
        grant them access to the operator page. Catalog plugins are installed
        by the control plane operator. Group owners configure them in the Varde
        app.
      </P>

      <H2>Advanced: run a plugin service yourself</H2>
      <P>
        Instead of installing a catalog plugin, an operator can run a service
        on a trusted network and load its manifest with{" "}
        <Code>--plugin /path/plugin.json</Code>, repeating the option as
        needed, or set <Code>VARDE_PLUGINS</Code> to a comma-separated list of
        manifest paths. For examples, see the{" "}
        <Link href="/docs/auto-tournament">Auto Tournament plugin guide</Link>{" "}
        or the{" "}
        <Link href="/docs/cs2-tournament">CS2 tournament cookbook</Link>. Follow
        the <Link href="/docs/build-a-plugin">plugin tutorial</Link> for the
        manifest and service details. For the complete protocol, see the{" "}
        <Link href="https://github.com/grendalaget/varde/blob/main/docs/plugins.md">
          full plugin reference
        </Link>
        .
      </P>
    </>
  );
}
