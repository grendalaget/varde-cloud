import type { ReactNode } from "react";

// Building blocks for docs pages. Server-safe (no client hooks) so pages can
// stay server components; interactive pieces go in their own "use client"
// components under src/components/docs/.

type CalloutTone = "info" | "warn" | "glod";

const CALLOUT_STYLES: Record<CalloutTone, string> = {
  info: "border-surface-400/60 bg-surface-200/60 text-foreground",
  warn: "border-warning/50 bg-warning/10 text-foreground",
  glod: "border-glod/50 bg-glod/10 text-foreground",
};

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={`my-6 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${CALLOUT_STYLES[tone]}`}
    >
      {title ? (
        <p className="mb-1 font-semibold text-foreground">{title}</p>
      ) : null}
      <div className="text-muted [&_a]:text-glod [&_a]:underline">
        {children}
      </div>
    </aside>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 list-none space-y-6 pl-0">{children}</ol>;
}

export function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-glod/50 bg-glod/10 text-sm font-semibold text-glod"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
        <div className="text-sm leading-relaxed text-muted [&_a]:text-glod [&_a]:underline">
          {children}
        </div>
      </div>
    </li>
  );
}

export function DocTitle({
  title,
  intro,
}: {
  title: string;
  intro?: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {intro ? (
        <p className="max-w-prose text-base leading-relaxed text-muted">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 mt-10 text-xl font-semibold text-foreground">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="my-4 leading-relaxed text-muted [&_a]:text-glod [&_a]:underline">
      {children}
    </p>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-sm text-foreground [overflow-wrap:anywhere]">
      {children}
    </code>
  );
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="my-4 min-w-0 max-w-full overflow-x-auto rounded-lg border border-separator bg-surface-secondary p-4">
      {language ? (
        <p className="mb-2 text-xs font-medium text-muted">{language}</p>
      ) : null}
      <pre className="min-w-max text-sm leading-relaxed">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
}
