import { Card, Link as HLink } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import type { Metadata } from "next";

import { LinkButton } from "@/components/link-button";
import { Reveal } from "@/components/reveal";
import {
  latestRelease,
  RELEASES_URL,
  TARGETS,
  type Target,
} from "@/lib/release";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Download the Varde installer for Windows, or packages for macOS and Linux, and start hosting game servers with your friends.",
};

const OTHER: { target: Target; note: string }[] = [
  { target: "macos-arm64", note: "Varde app, .dmg" },
  { target: "macos-x64", note: "Varde app, .dmg" },
  { target: "linux-deb", note: "Background service for servers, NAS and headless PCs" },
  { target: "linux-rpm", note: "Background service for servers, NAS and headless PCs" },
  { target: "linux-arm64-deb", note: "Background service, e.g. Raspberry Pi" },
];

function published(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

export default async function DownloadPage() {
  const release = await latestRelease();
  const date = published(release?.publishedAt ?? null);
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <Reveal>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Download Varde
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Install Varde on each PC that plays. Sign in, approve the PC in your
          browser, and pick up in the Varde app: choose a game, invite your
          friends, play.
        </p>
      </Reveal>

      <Reveal className="mt-10">
        <Card className="rounded-xl border border-separator bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-semibold">
              Varde for Windows
            </h2>
            {release?.channel === "nightly" && (
              <span className="rounded-full border border-glod/40 px-2.5 py-0.5 text-xs font-medium text-glod">
                Experimental nightly build
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            Windows 10 and 11, 64-bit. One installer with the Varde app, the
            background service that hosts and joins games, and the private
            network that connects your group&apos;s PCs.
          </p>
          {release ? (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* /download/[target] is a redirect route, not a page. */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/download/windows"
                  className={buttonVariants({ size: "lg" })}
                >
                  Download for Windows
                </a>
                <span className="text-sm text-muted">
                  {release.channel === "nightly" ? "Nightly " : "Version "}
                  <span className="font-mono text-xs">{release.version}</span>
                  {date && <> · {date}</>}
                </span>
              </div>
              {release.channel === "nightly" && (
                <p className="mt-4 text-sm text-muted">
                  There is no stable release yet. Nightly builds come straight
                  from the latest code and can have rough edges.
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {release.windowsSigning === "signed"
                  ? "This build is code-signed."
                  : release.windowsSigning === "unsigned"
                    ? "This build isn't code-signed yet, so Windows may warn that the publisher is unknown. "
                    : "Windows may warn before running an installer from a new publisher. "}
                {release.windowsSigning !== "signed" && (
                  <>
                    Only run installers you downloaded from this page or{" "}
                    <HLink
                      href={release.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
                    >
                      Varde&apos;s GitHub release
                    </HLink>
                    , and check them against its SHA256SUMS if you want to be
                    sure.
                  </>
                )}
              </p>
            </>
          ) : (
            <div className="mt-6">
              <LinkButton
                href={RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                size="lg"
              >
                See releases on GitHub
              </LinkButton>
              <p className="mt-3 text-sm text-muted">
                We couldn&apos;t check the latest release just now. Look for
                the file starting with VardeSetup and ending in .exe.
              </p>
            </div>
          )}
        </Card>
      </Reveal>

      {release && (
        <Reveal className="mt-8">
          <Card className="rounded-xl border border-separator bg-surface p-6">
            <h2 className="font-display text-lg font-semibold">
              Other systems
            </h2>
            <ul className="mt-3 divide-y divide-separator text-sm">
              {OTHER.filter(({ target }) => release.urls[target]).map(
                ({ target, note }) => (
                  <li
                    key={target}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
                  >
                    <a
                      href={`/download/${target}`}
                      className="font-medium underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
                    >
                      {TARGETS[target].label}
                    </a>
                    <span className="text-muted">{note}</span>
                  </li>
                ),
              )}
            </ul>
            <p className="mt-4 text-sm text-muted">
              Control plane, relay, checksums and signatures:{" "}
              <HLink
                href={release.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
              >
                all files on GitHub
              </HLink>
              .
            </p>
          </Card>
        </Reveal>
      )}

      <Reveal className="mt-12">
        <Card className="rounded-xl border border-separator bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">Documentation</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            <HLink
              href="https://github.com/grendalaget/varde#readme"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
            >
              Overview and components
            </HLink>
          </li>
          <li>
            <HLink
              href="https://github.com/grendalaget/varde/tree/main/docs"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
            >
              Architecture and development docs
            </HLink>
          </li>
          <li>
            <HLink
              href="https://github.com/grendalaget/varde/blob/main/docs/releasing.md"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
            >
              Releases, signatures and verification
            </HLink>
          </li>
          </ul>
        </Card>
      </Reveal>

      <Reveal className="mt-8">
        <Card className="rounded-xl border border-separator bg-surface p-6">
          <h2 className="font-display text-lg font-semibold">
            Self-hosting the control plane
          </h2>
          <p className="mt-2 text-sm text-muted">
            The hosted control plane at varde.games is the default;
            self-hosting stays fully supported. See the repo docs for running
            your own control plane and pointing installs at it.
          </p>
        </Card>
      </Reveal>
    </main>
  );
}
