"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Accordion, SearchField } from "@heroui/react";

// Interactive troubleshooting index. Type how you would describe the problem
// and the list narrows live; expand an entry for the fix. Every entry ends
// with a link out to GitHub issues for the cases docs cannot cover.

const ISSUES_URL = "https://github.com/grendalaget/varde/issues";

type Problem = {
  id: string;
  title: string;
  keywords: string;
  body: ReactNode;
};

function FixSteps({ children }: { children: ReactNode }) {
  return <ol className="mt-2 list-decimal space-y-1.5 pl-5">{children}</ol>;
}

function StepItem({ children }: { children: ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}

const PROBLEMS: Problem[] = [
  {
    id: "smartscreen",
    title: "Windows says \u201cWindows protected your PC\u201d when I install",
    keywords:
      "smartscreen install installer setup protected blocked blue warning unsigned exe",
    body: (
      <>
        <p>
          Varde builds are not code-signed yet, so Windows SmartScreen warns
          about new downloads.
        </p>
        <FixSteps>
          <StepItem>
            Check the file came from the official{" "}
            <a
              href="https://github.com/grendalaget/varde/releases"
              target="_blank"
              rel="noreferrer"
            >
              GitHub releases page
            </a>
            .
          </StepItem>
          <StepItem>
            Click <strong className="text-foreground">More info</strong>, then{" "}
            <strong className="text-foreground">Run anyway</strong>.
          </StepItem>
          <StepItem>
            On a work or school PC the button can be missing; that means your
            administrator blocks unsigned apps and only they can allow it.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "invite",
    title: "My invite link does not work",
    keywords: "invite link join group friends expired exhausted code accept",
    body: (
      <>
        <p>Invite links can expire or run out of uses.</p>
        <FixSteps>
          <StepItem>
            Sign in on your Varde dashboard first, then open the link again.
          </StepItem>
          <StepItem>
            Check the link was copied whole, with no missing characters at the
            end.
          </StepItem>
          <StepItem>
            Still nothing? The link is likely expired. Ask the group&rsquo;s
            owner to create a fresh invite from the dashboard&rsquo;s Members
            page.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "link-code",
    title: "My link code is not accepted",
    keywords:
      "link code pair connect machine word letters expire ember stone type",
    body: (
      <>
        <p>
          Link codes look like <code>EMBER-42-STONE</code> and are single-use;
          they also expire after a short while.
        </p>
        <FixSteps>
          <StepItem>Type it exactly as shown, dashes included.</StepItem>
          <StepItem>
            If it expired, start linking again in the app to get a fresh code.
          </StepItem>
          <StepItem>
            Make sure you are signed in on the dashboard when you enter it.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "unreachable",
    title: "I cannot reach my friend\u2019s server",
    keywords:
      "connect join unreachable offline cant can't cannot server address connection timed out",
    body: (
      <>
        <p>Work top to bottom; most causes are early in the list.</p>
        <FixSteps>
          <StepItem>
            On the dashboard, check the server actually shows as running.
          </StepItem>
          <StepItem>
            Check the hosting friend&rsquo;s Varde is online. If their app is
            off, the server may have moved to another machine or stopped.
          </StepItem>
          <StepItem>
            Check your own Varde is running and your PC is linked.
          </StepItem>
          <StepItem>
            Connect to the address Varde shows on your machine (it starts with
            127.77), not your friend&rsquo;s home IP. When a direct path is
            blocked, Varde relays the traffic for you automatically.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "lag",
    title: "My ping is high or the game feels laggy",
    keywords: "lag ping slow latency rubber band delay stutter fps relay",
    body: (
      <>
        <p>
          When a direct connection is blocked by a router or firewall, Varde
          sends traffic through an encrypted relay, which adds some latency.
        </p>
        <FixSteps>
          <StepItem>
            Give it a minute. The mesh keeps looking for a direct path and
            switches to it when it finds one.
          </StepItem>
          <StepItem>
            If ping stays high, let a different machine host. A wired
            connection beats Wi-Fi.
          </StepItem>
          <StepItem>
            A lag spike right after hosting moved to another PC is normal and
            settles on its own.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "service",
    title: "Varde is missing from my tray, or the service is not running",
    keywords:
      "tray icon missing service stopped start crashed background agent noagent",
    body: (
      <>
        <p>Varde runs as a small background service with a tray icon.</p>
        <FixSteps>
          <StepItem>
            Open Varde from the Start menu. If the app opens but cannot reach
            the service, use its restart option.
          </StepItem>
          <StepItem>Restart your PC; the service starts with Windows.</StepItem>
          <StepItem>
            If it keeps happening, reinstall from the{" "}
            <Link href="/download">download page</Link>. Your saves live on the
            group&rsquo;s machines, not only yours.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "sign-in",
    title: "I cannot sign in on varde.games",
    keywords:
      "sign in login password account website auth email forgot wrong credentials",
    body: (
      <>
        <FixSteps>
          <StepItem>
            The site needs its own account: create one on the{" "}
            <Link href="/auth/sign-up">sign-up page</Link> first.
          </StepItem>
          <StepItem>
            Passwords are at least 8 characters. Check caps lock and for a
            stray space at the end when pasting.
          </StepItem>
          <StepItem>
            Try a private window or another browser to rule out a stale
            session.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "friends-join",
    title: "My friends cannot join the server",
    keywords:
      "friends join connect multiplayer players cant can't cannot invite ports",
    body: (
      <>
        <p>
          Every player installs Varde and links their PC; that is what gives
          each machine the stable local address for the server.
        </p>
        <FixSteps>
          <StepItem>The owner sends each friend an invite link.</StepItem>
          <StepItem>
            Each friend installs Varde and signs in on the dashboard it
            opens, then links their PC; the{" "}
            <Link href="/docs/join-a-server">join guide</Link> walks them
            through it.
          </StepItem>
          <StepItem>
            They connect to the address shown in their own app. No port
            forwarding or IP sharing needed.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "failover",
    title: "Everyone got kicked when the host\u2019s PC closed",
    keywords:
      "host closed laptop offline kicked disconnect moved dropped shutdown sleep",
    body: (
      <>
        <p>That is failover working, not a bug.</p>
        <FixSteps>
          <StepItem>
            When the host drops, Varde moves the server to the next machine
            that holds the save. Players see a short disconnect, then
            reconnect to the same address.
          </StepItem>
          <StepItem>
            If it happens a lot, flag an always-on backup machine or let a
            stable PC host; the{" "}
            <Link href="/docs/host-a-server">host guide</Link> covers both.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
  {
    id: "files",
    title: "Where are my saves and logs?",
    keywords:
      "save files logs location folder backup find where stored programdata",
    body: (
      <>
        <p>
          You never move save files by hand: Varde keeps the save on the
          machines that host your server and replicates it to backup machines
          automatically.
        </p>
        <FixSteps>
          <StepItem>
            If support asks for logs on Windows, they live in{" "}
            <code>C:\ProgramData\Varde\logs</code> (a protected system folder,
            so you may need admin to open it).
          </StepItem>
          <StepItem>
            On Linux the same logs are in <code>/var/lib/varde/logs</code>.
          </StepItem>
        </FixSteps>
      </>
    ),
  },
];

function matchesQuery(p: Problem, terms: string[]) {
  const hay = `${p.title} ${p.keywords}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export function ProblemFinder() {
  const [query, setQuery] = useState("");

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = PROBLEMS.filter((p) => matchesQuery(p, terms));
  const matchesSet = new Set(matches.map((p) => p.id));

  return (
    <div className="my-8">
      <SearchField
        value={query}
        onChange={setQuery}
        aria-label="Search troubleshooting fixes"
        className="w-full"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Describe the problem" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <p className="mt-3 text-xs text-muted" aria-live="polite">
        {terms.length === 0
          ? `${PROBLEMS.length} common fixes`
          : `${matches.length} of ${PROBLEMS.length} fixes`}
      </p>

      {/* Every item stays mounted while filtering; non-matches are hidden so
          expanded state and panel animations never replay on remount. */}
      <Accordion variant="surface" allowsMultipleExpanded className="mt-4">
        {PROBLEMS.map((p) => (
          <Accordion.Item
            key={p.id}
            id={p.id}
            className={matchesSet.has(p.id) ? undefined : "hidden"}
          >
            <Accordion.Heading>
              <Accordion.Trigger>
                {p.title}
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="text-sm text-muted [&_a]:text-glod [&_a]:underline [&_code]:rounded [&_code]:bg-surface-tertiary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8em] [&_code]:text-foreground">
                {p.body}
                <p className="mt-3 text-sm">
                  Still stuck?{" "}
                  <a href={ISSUES_URL} target="_blank" rel="noreferrer">
                    Open an issue on GitHub
                  </a>{" "}
                  with your logs attached.
                </p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      {matches.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          No fix matches that. Try different words, like &ldquo;lag&rdquo;,
          &ldquo;invite&rdquo; or &ldquo;tray&rdquo;, or{" "}
          <a
            href={ISSUES_URL}
            target="_blank"
            rel="noreferrer"
            className="text-glod underline"
          >
            open an issue on GitHub
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
