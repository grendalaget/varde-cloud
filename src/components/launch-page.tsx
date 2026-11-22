import Link from "next/link";

import { Callout, DocTitle, H2, P } from "@/components/docs-primitives";
import { LinkButton } from "@/components/link-button";
import type { LaunchPage as LaunchPageContent } from "@/lib/launch-content";

export function LaunchPage({ page }: { page: LaunchPageContent }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
      <DocTitle title={page.title} intro={page.description} />
      <div className="flex flex-wrap gap-3">
        <LinkButton href="/download">Download Varde</LinkButton>
        <LinkButton href="/docs/host-a-server" variant="secondary">Hosting guide</LinkButton>
      </div>
      {page.sections.map((section) => (
        <section key={section.title}>
          <H2>{section.title}</H2>
          <P>{section.body}</P>
        </section>
      ))}
      <Callout title="Start with the requirements">
        Varde is in beta. Read the <Link href="/faq" className="underline">FAQ</Link> and
        {" "}<Link href="/pricing" className="underline">pricing</Link> before choosing your hosting setup.
      </Callout>
      {page.source ? <P><a href={page.source.href}>{page.source.label}</a></P> : null}
    </main>
  );
}
