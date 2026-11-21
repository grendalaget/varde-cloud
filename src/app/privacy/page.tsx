import type { Metadata } from "next";

import { DocTitle, H2, P } from "@/components/docs-primitives";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Grendalaget handles personal data when you use Varde.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <DocTitle title="Privacy policy" intro="Grendalaget operates Varde from Norway, in the European Economic Area (EEA). We are the controller for personal data processed to provide this service and follow the GDPR." />
      <H2>Data we process and why</H2>
      <P>
        When you create an account we store your name, email address, email
        verification status, password hash, account timestamps and subscription
        plan. Our account schema also supports an optional profile image and
        provider account identifiers and tokens if a sign-in provider is enabled.
        Email and password are the currently available sign-in method.
      </P>
      <P>
        Sessions include a session token, expiry, timestamps, IP address and
        browser user agent. We store verification and password reset tokens with
        expiry times. We use this data to authenticate you, secure accounts and
        send transactional verification and password reset emails.
      </P>
      <P>
        The control plane handles group membership, invitations, linked device
        identities, server configuration and operational records needed to
        coordinate hosting and failover. Managed anchor records include your
        user and group IDs, requested state, machine, volume and node IDs,
        provisioning attempts, timestamps and operational errors. Anchors hold
        replicated server saves. Avoid placing unnecessary personal data in
        server names, configuration, logs or saves.
      </P>
      <P>
        Polar handles checkout and payment details as merchant of record. We
        associate your Varde user ID with Polar customer and subscription state
        to maintain your plan. We do not store card numbers. Infrastructure
        providers may process request metadata and operational logs for delivery,
        security and troubleshooting. Support messages include whatever you send us.
      </P>
      <H2>Cookies, analytics and attribution</H2>
      <P>
        Essential first-party session cookies keep you signed in. A separate
        first-party attribution cookie records the first referral code (ref)
        and campaign parameters (utm_*) we receive, for up to 30 days. These
        values are copied to your account when you sign up so we can understand
        which launch campaigns bring new users. Do not put personal or secret
        information in campaign URLs. You can remove this cookie in your browser.
      </P>
      <P>
        When configured, we use Plausible-compatible cookieless analytics for
        page views, download targets, sign-up attempts and account creation,
        email verification and checkout starts. We do not send names, emails,
        user IDs, session tokens or saves as event properties. Analytics may
        process IP addresses and browser information to produce aggregate
        statistics without setting analytics cookies. When analytics is not
        configured, no analytics script or events are sent.
      </P>
      <H2>Legal bases and providers</H2>
      <P>
        We process account, hosting and subscription data to perform our contract
        with you. Security, service reliability and limited campaign measurement
        rely on our legitimate interests, balanced against your rights. Legal
        obligations may require certain billing records. Where applicable law
        requires consent, we must obtain it before the relevant optional processing.
      </P>
      <P>
        Our providers include Vercel (website hosting), Turso (account and anchor
        database), Fly.io (control plane and anchor hosting), Resend
        (transactional email), and Plausible Analytics or the configured
        Plausible-compatible operator (analytics, when enabled). Polar is the
        merchant of record and processes billing data under its own privacy
        policy. Providers may process data outside Norway or the EEA. Where
        required, transfers must use appropriate GDPR safeguards such as standard
        contractual clauses or an applicable adequacy decision. Contact us for
        details of the configured providers and transfer arrangements.
      </P>
      <H2>Retention</H2>
      <P>
        We retain account and associated attribution data while your account is
        active, then delete or anonymise it when no longer needed, subject to
        security, dispute and legal retention needs. Sessions and verification
        tokens have expiry times and cannot be used after expiry; expired rows
        may remain until cleanup. Support correspondence and operational logs
        are kept only as needed for their purpose. Deleted data may remain in
        backups until those backups rotate. Contact us for a deletion request
        or the current operational retention schedule.
      </P>
      <P>
        Detached managed anchor volumes are retained for the configured recovery
        period, 14 days by default, before the reconciler deletes them. Copies
        held by other members of your peer group are controlled by those members.
        Polar retains billing records according to its policy and legal obligations.
      </P>
      <H2>Your rights and contact</H2>
      <P>
        You may request access, correction, deletion, restriction and portability
        of your personal data, object to processing based on legitimate
        interests, and withdraw consent where processing relies on it. These
        rights are subject to GDPR conditions and legal retention requirements.
        Contact <a href="mailto:support@varde.games">support@varde.games</a> to
        exercise your rights or ask a privacy question. You may complain to
        Norway&apos;s <a href="https://www.datatilsynet.no/en/">Datatilsynet</a>
        {" "}or your local EEA supervisory authority.
      </P>
    </main>
  );
}
