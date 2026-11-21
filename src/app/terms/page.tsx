import type { Metadata } from "next";
import Link from "next/link";

import { DocTitle, H2, P } from "@/components/docs-primitives";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms for using Varde accounts, peer hosting and managed anchors.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <DocTitle title="Terms of service" intro="These terms cover the Varde hosted service operated by Grendalaget in Norway. By creating an account or using the service, you agree to these terms." />
      <H2>Your account and acceptable use</H2>
      <P>
        Keep your credentials secure and provide accurate account information.
        You are responsible for activity on your account and for permissions
        you grant to group members and devices. Do not use Varde for unlawful
        content, harassment, malware, attacks, unauthorised access, infringement
        or interference with other users or infrastructure. Do not evade service
        limits or abuse shared resources. We may restrict or suspend access to
        address abuse, security risks, legal requirements or unpaid subscriptions.
        Contact support if you believe a restriction is mistaken.
      </P>
      <H2>Games, servers and saves</H2>
      <P>
        You must obtain and comply with the game EULAs, licences and permissions
        required for your server, plugins and content. Varde does not grant a
        licence to any game or third-party content. You are responsible for what
        you host and share, and for maintaining independent backups of important
        saves. Peer hosting and failover depend on available devices, networks
        and current replicated saves. They do not guarantee uninterrupted play
        or zero data loss.
      </P>
      <H2>Anchors, paid plans and refunds</H2>
      <P>
        Managed cloud anchors are optional paid hosting and save replication
        services. Prices, billing intervals and plan limits are shown on the
        <Link href="/pricing"> pricing page</Link> and at checkout. Polar is the
        merchant of record and handles payments, taxes, subscriptions and
        refunds under the terms and refund policy presented by Polar at checkout.
        Manage or cancel your subscription through the customer portal in your
        account. Statutory consumer and withdrawal rights still apply.
      </P>
      <P>
        Cancellation or loss of plan eligibility can stop managed anchors.
        Retained anchor volumes are deleted after the recovery period, 14 days
        by default. Export or back up saves before ending your subscription.
        Free accounts can self-host anchors but do not include managed cloud anchors.
      </P>
      <H2>Beta service and liability</H2>
      <P>
        Varde is in beta and is provided as is and as available. Features,
        capacity and availability may change, and faults or interruptions may
        occur. To the extent permitted by law, we disclaim warranties and
        liability for service interruptions, lost saves and indirect losses.
        Nothing in these terms excludes mandatory consumer protections or
        liability that cannot lawfully be excluded.
      </P>
      <H2>Software licence and privacy</H2>
      <P>
        The Varde software is licensed under
        {" "}<a href="https://github.com/grendalaget/varde/blob/main/LICENSE">AGPL-3.0-or-later</a>.
        These hosted-service terms do not restrict your rights under that
        licence. Third-party software has its own licences. Our
        {" "}<Link href="/privacy">privacy policy</Link> explains how we handle
        personal data.
      </P>
      <H2>Changes and contact</H2>
      <P>
        We may update these terms as the service develops. Material changes to
        existing subscriptions will be communicated before they take effect.
        Norwegian law applies without depriving consumers of mandatory rights
        in their country of residence. For support, account closure, billing
        questions or concerns about these terms, email
        {" "}<a href="mailto:support@varde.games">support@varde.games</a>.
      </P>
    </main>
  );
}
