"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { SearchField } from "@heroui/react";

// A-Z glossary of Varde terms, one plain sentence each. A filter input
// narrows the list and a letter bar jumps to a section. Terms link into
// /docs/how-varde-works where the moving parts get their picture.

type Term = {
  term: string;
  def: ReactNode;
  keywords?: string;
};

const TERMS: Term[] = [
  {
    term: "Agent",
    def: (
      <>
        The Varde app itself, running quietly on your machine. It hosts
        servers, keeps saves up to date, and sits as an icon in your system
        tray.
      </>
    ),
    keywords: "app tray service background",
  },
  {
    term: "Anchor",
    def: (
      <>
        A machine that always keeps a copy of every save, so the newest one
        survives even when every player PC is off. Flag your own always-on
        machine, or use a managed cloud anchor.
      </>
    ),
    keywords: "always-on backup save storage",
  },
  {
    term: "Cairn",
    def: (
      <>
        A stack of stones used as a trail marker. Varde is the Norwegian word
        for cairn; in the logo, the single lit stone marks the machine hosting
        right now.
      </>
    ),
    keywords: "logo varde stones name",
  },
  {
    term: "Cloud anchor",
    def: (
      <>
        An anchor run by Varde for you, so you do not need an always-on
        machine of your own. An optional paid extra, still coming soon; see{" "}
        <Link href="/pricing">pricing</Link>.
      </>
    ),
    keywords: "paid backup hosted",
  },
  {
    term: "Control plane",
    def: (
      <>
        The shared address book for your group. It hands out invites and link
        codes, remembers who owns which server, and tells machines where to
        find each other. The default one is hosted at varde.games. See{" "}
        <Link href="/docs/how-varde-works">how Varde works</Link>.
      </>
    ),
    keywords: "dashboard sign in account coordination",
  },
  {
    term: "Failover",
    def: (
      <>
        The automatic handover when the hosting machine drops: another machine
        that holds the save takes over, and players reconnect to the same
        address.
      </>
    ),
    keywords: "moved host offline disconnect",
  },
  {
    term: "Glød",
    def: (
      <>
        Norwegian for ember; the orange accent in Varde&rsquo;s palette. It is
        used sparingly, and it marks the machine hosting right now.
      </>
    ),
    keywords: "orange ember color accent",
  },
  {
    term: "Host",
    def: (
      <>
        The machine currently running your server. Only one machine hosts at
        a time; the lit stone shows which.
      </>
    ),
    keywords: "hosting machine server runs",
  },
  {
    term: "Invite",
    def: (
      <>
        The link a group&rsquo;s owner sends to add you to the group. Invites
        can expire or run out of uses; ask for a fresh one.
      </>
    ),
    keywords: "invite code invite link join group",
  },
  {
    term: "Link code",
    def: (
      <>
        The short code like <code>EMBER-42-STONE</code> the app shows while
        you link a machine. Type it on the dashboard while signed in; codes
        expire.
      </>
    ),
    keywords: "pair connect machine word code",
  },
  {
    term: "Mesh",
    def: (
      <>
        The encrypted direct connections between your group&rsquo;s machines.
        Game traffic prefers the mesh and only detours through a relay when
        the direct path is blocked. See{" "}
        <Link href="/docs/how-varde-works">how Varde works</Link>.
      </>
    ),
    keywords: "peer to peer p2p quic connection",
  },
  {
    term: "Peer",
    def: (
      <>
        One machine in your group&rsquo;s mesh. Every friend who installs
        Varde becomes a peer.
      </>
    ),
    keywords: "machine node member",
  },
  {
    term: "Relay",
    def: (
      <>
        A Varde-run machine that forwards encrypted traffic when two peers
        cannot connect directly. It cannot read the traffic; it only adds a
        little ping.
      </>
    ),
    keywords: "forward blocked nat latency",
  },
  {
    term: "Save",
    def: (
      <>
        Everything the game needs to pick up where you left off: the world
        files, player data and settings. Players usually say
        &ldquo;world&rdquo;; Varde calls it the save.
      </>
    ),
    keywords: "world files data backup",
  },
  {
    term: "Server",
    def: (
      <>
        The thing your friends connect to: Minecraft, Valheim or another game
        running as a service. In Varde a server is not tied to one machine; it
        keeps its name, address and saves while hosting moves around. The save
        is its data; the server is the save plus everything needed to run it.
      </>
    ),
    keywords: "game world service minecraft valheim",
  },
  {
    term: "Session",
    def: (
      <>
        One run of a server, from the moment it starts on a machine until it
        stops. If hosting moves mid-game, the old session ends and a new one
        begins with the same save.
      </>
    ),
    keywords: "run start stop",
  },
  {
    term: "Snapshot",
    def: (
      <>
        A point-in-time copy of the save. Varde takes them on a schedule and
        before the server stops, and spreads them to the machines that could
        host next.
      </>
    ),
    keywords: "backup copy point in time",
  },
  {
    term: "Tray",
    def: (
      <>
        The system tray next to your clock, where the Varde icon lives.
        Right-click it for status and quick actions.
      </>
    ),
    keywords: "icon notification area",
  },
  {
    term: "World",
    def: (
      <>
        What players usually call it. In the app and these docs you will see
        &ldquo;save&rdquo; instead; same thing, the files a server loads.
      </>
    ),
    keywords: "save game files",
  },
];

function firstLetter(term: string) {
  return term[0]!.toUpperCase();
}

const ALL_LETTERS = [...new Set(TERMS.map((t) => firstLetter(t.term)))];

export function GlossaryIndex() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = TERMS.filter(
    (t) =>
      q === "" ||
      t.term.toLowerCase().includes(q) ||
      (t.keywords ?? "").includes(q),
  );
  const matchesSet = new Set(matches.map((t) => t.term));

  const letters = [...new Set(matches.map((t) => firstLetter(t.term)))];

  return (
    <div className="my-8">
      <SearchField
        value={query}
        onChange={setQuery}
        aria-label="Filter glossary terms"
        className="w-full"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Filter terms" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {letters.length > 0 ? (
        <nav
          aria-label="Jump to letter"
          className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
        >
          {letters.map((l) => (
            <a
              key={l}
              href={`#gl-${l}`}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              {l}
            </a>
          ))}
        </nav>
      ) : null}

      {letters.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No term matches that. Try a shorter word, or clear the filter to
          browse the full A-Z.
        </p>
      ) : null}

      {/* Terms and sections stay mounted while filtering; non-matches are
          hidden so nothing remounts or replays on each keystroke. */}
      {ALL_LETTERS.map((letter) => {
        const sectionTerms = TERMS.filter(
          (t) => firstLetter(t.term) === letter,
        );
        const visible = letters.includes(letter);
        return (
          <section
            key={letter}
            id={`gl-${letter}`}
            className={`scroll-mt-28 ${visible ? "" : "hidden"}`}
          >
            <h2 className="mt-10 text-xs font-semibold uppercase tracking-wider text-muted">
              {letter}
            </h2>
            <dl>
              {sectionTerms.map((t) => (
                <div
                  key={t.term}
                  className={`border-b border-separator py-5 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-6 ${
                    matchesSet.has(t.term) ? "" : "hidden"
                  }`}
                >
                  <dt className="text-sm font-semibold text-foreground">
                    {t.term}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted sm:mt-0 [&_a]:text-glod [&_a]:underline [&_code]:rounded [&_code]:bg-surface-tertiary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:text-foreground">
                    {t.def}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
