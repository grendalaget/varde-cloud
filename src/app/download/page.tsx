import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Install Varde for Windows, macOS, or Linux and start hosting game servers with your friends.",
};

export default function DownloadPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Download Varde
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Varde runs on every player&apos;s machine. Grab the latest release,
        sign in, and link your PC to your group — the dashboard walks you
        through it.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href="https://github.com/grendalaget/varde/releases"
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-separator bg-surface p-6 transition-colors hover:bg-surface-secondary"
        >
          <h2 className="font-display text-lg font-semibold">
            Windows installer
          </h2>
          <p className="mt-2 text-sm text-muted">
            VardeSetup.exe — agent, mesh and desktop app in one install. Works
            on Windows 10 and 11.
          </p>
          <p className="mt-4 text-sm font-medium text-glod group-hover:underline">
            Latest release →
          </p>
        </a>
        <a
          href="https://github.com/grendalaget/varde/releases"
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl border border-separator bg-surface p-6 transition-colors hover:bg-surface-secondary"
        >
          <h2 className="font-display text-lg font-semibold">Linux packages</h2>
          <p className="mt-2 text-sm text-muted">
            .deb, .rpm and binaries for the agent and control plane. macOS
            builds are available from source.
          </p>
          <p className="mt-4 text-sm font-medium text-glod group-hover:underline">
            Latest release →
          </p>
        </a>
      </div>

      <div className="mt-12 rounded-xl border border-separator bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">Documentation</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>
            <a
              href="https://github.com/grendalaget/varde#readme"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
            >
              Overview and components
            </a>
          </li>
          <li>
            <a
              href="https://github.com/grendalaget/varde/tree/main/docs"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
            >
              Architecture and development docs
            </a>
          </li>
          <li>
            <a
              href="https://github.com/grendalaget/varde/blob/main/docs/releasing.md"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
            >
              Releases, signatures and verification
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-8 rounded-xl border border-separator bg-surface p-6">
        <h2 className="font-display text-lg font-semibold">
          Self-hosting the control plane
        </h2>
        <p className="mt-2 text-sm text-muted">
          The hosted control plane at varde.games is the default — self-hosting
          stays fully supported. See the repo docs for running your own control
          plane and pointing installs at it.
        </p>
      </div>
    </main>
  );
}
