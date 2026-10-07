import Link from "next/link";
import { Mark } from "@/components/brand";

const HOW_IT_WORKS = [
  {
    title: "Peer-hosted by the group",
    body: "One member's PC hosts at a time — the lit stone in the cairn. Anyone in the group can take over; no rented hardware required to play.",
    icon: (
      <path d="M4 17h16M6 17v-5l4-3v8M10 17V7l4-3v13M14 17V9l4-2v10" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Replicated snapshots",
    body: "Saves are deduplicated, content-addressed snapshots replicated across the group's machines. Stop mid-raid on one PC, resume on another.",
    icon: (
      <path d="M7 7h10v10H7z M4 4h10v10 M17 4v-0M7 4a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v10" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 2) scale(0.9)" />
    ),
  },
  {
    title: "Automatic failover",
    body: "When the host goes offline, Varde hands the server to another member's machine and the ember moves to a new stone. Players reconnect to the same save.",
    icon: (
      <path d="M4 10a8 8 0 0 1 13-3M20 10a8 8 0 0 1-13 3M17 3v4h-4M7 17v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Stable loopback addresses",
    body: "Every server gets a stable 127.77.x.y address on each player's own machine. Bookmark it once — it never changes when hosting moves.",
    icon: (
      <path d="M10 4a6 6 0 1 0 6 6M10 4a6 6 0 0 0-6 6m6-6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Encrypted mesh",
    body: "Peer-to-peer QUIC with NAT traversal and relay fallback. No port forwarding, no router admin, no exposed game ports.",
    icon: (
      <path d="M6 10V7a6 6 0 0 1 12 0v3M5 10h14v9H5z M12 14v2" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Always-on anchors",
    body: "Optional anchor nodes hold replicated saves so group state survives even when every player PC is offline. Self-host one, or use a cloud anchor.",
    icon: (
      <path d="M12 3v9m0 0a5 5 0 0 1 5 5v1H7v-1a5 5 0 0 1 5-5zM4 21h16" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

const GAMES = [
  {
    name: "Minecraft Java",
    status: "Supported",
    body: "Vanilla and modded servers with snapshot saves and zero-config joins.",
  },
  {
    name: "Valheim",
    status: "Supported",
    body: "Dedicated-server hosting with stop-then-snapshot saves, straight from the group.",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 70% 20%, rgba(255,91,31,0.09), transparent 70%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(54,65,73,0.35), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-2 md:pb-28 md:pt-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-separator bg-surface px-3 py-1 text-xs text-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-glod" />
              Open source · AGPL-3.0-or-later
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Game servers built by many hands.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Varde lets your friend group co-host game servers. Saves replicate
              across everyone&apos;s machines, hosting fails over automatically,
              and every player connects to the same stable address — no rented
              servers, no port forwarding.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/download"
                className="rounded-lg bg-glod px-5 py-3 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d]"
              >
                Download Varde
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-lg border border-separator bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-tertiary"
              >
                How it works
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              Available for Windows, macOS, and Linux ·{" "}
              <a
                href="https://github.com/grendalaget/varde"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-skifer-600 underline-offset-4 hover:text-foreground"
              >
                grendalaget/varde
              </a>
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <Mark
              animated
              title="A cairn; the lit stone moves between friends"
              className="h-48 w-48 text-skifer-100 drop-shadow-[0_0_40px_rgba(255,91,31,0.15)] sm:h-64 sm:w-64 md:h-80 md:w-80"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-separator bg-skifer-900/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Varde turns your group&apos;s own PCs into a resilient hosting
            collective. A cairn belongs to no one — and neither does your server.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-separator bg-surface p-6"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-skifer-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden
                >
                  {f.icon}
                </svg>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games */}
      <section id="games" className="border-t border-separator">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Supported games
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Drivers are per-game and grouped by hosting style — more games join
            as they fit an existing hosting approach.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {GAMES.map((g) => (
              <div
                key={g.name}
                className="flex items-start justify-between gap-4 rounded-xl border border-separator bg-surface p-6"
              >
                <div>
                  <h3 className="font-display text-lg font-semibold">{g.name}</h3>
                  <p className="mt-2 text-sm text-muted">{g.body}</p>
                </div>
                <span className="shrink-0 rounded-full border border-separator bg-surface-secondary px-2.5 py-1 text-xs text-muted">
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cloud anchors teaser */}
      <section className="border-t border-separator bg-skifer-900/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-medium text-glod">Coming soon</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Cloud anchors
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              A managed always-on anchor keeps your group&apos;s saves safe even
              when nobody&apos;s PC is online. The core stays open source —
              anchors are just another stone in the cairn.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-block rounded-lg border border-separator bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-tertiary"
            >
              See plans
            </Link>
          </div>
          <div className="rounded-xl border border-separator bg-surface p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Anchor</p>
              <p className="font-display text-2xl font-bold">
                $3<span className="text-sm font-normal text-muted">/mo</span>
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>· ~25 GB deduplicated save storage</li>
              <li>· Every server in the group</li>
              <li>· Always-on replicated saves</li>
              <li>· 1 region</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Open source */}
      <section className="border-t border-separator">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <div className="rounded-2xl border border-separator bg-surface p-8 md:p-12">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Open source, forever.
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Varde&apos;s core technology is{" "}
              <a
                href="https://github.com/grendalaget/varde/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline decoration-skifer-600 underline-offset-4"
              >
                AGPL-3.0-or-later
              </a>
              . Run it, study it, modify it, self-host all of it. Only the
              optional managed hosting lives here.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://github.com/grendalaget/varde"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-glod px-5 py-3 text-sm font-semibold text-natt transition-colors hover:bg-[#ff6f3d]"
              >
                Star on GitHub
              </a>
              <a
                href="https://github.com/grendalaget/varde/tree/main/docs"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-separator bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-tertiary"
              >
                Read the docs
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
