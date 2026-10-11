"use client";

import { useState } from "react";

// Stylized Windows tray menu for Varde. Click a menu item to learn what it
// does. `hosting` shows the menu while this PC is running a server: the
// ember lights and two extra status lines appear.

type Item = {
  label: string;
  enabled?: boolean;
  checked?: boolean;
  hint?: string;
};

const SEP = "sep" as const;

const BASE_ITEMS: (Item | typeof SEP)[] = [
  { label: "Varde: Online · Friday crew", enabled: false },
  {
    label: "Open Varde",
    hint: "Opens the status window, the same one that showed your link code.",
  },
  {
    label: "Stop Varde service…",
    hint: "Stops Varde on this PC. Greyed out while this PC is hosting.",
  },
];

const HOSTING_ITEMS: (Item | typeof SEP)[] = [
  { label: "Hosting Valheim Dedicated on this PC", enabled: false },
  { label: "Latest safe save: 2 min ago", enabled: false },
];

const TAIL_ITEMS: (Item | typeof SEP)[] = [
  SEP,
  {
    label: "Open dashboard",
    hint: "Opens varde.games in your browser, where servers and invites live.",
  },
  {
    label: "Re-link this PC… (administrator)",
    hint: "Moves this PC to a different group. Needs administrator approval.",
  },
  {
    label: "Open logs folder",
    hint: "Where Varde writes its logs. Look here first if something breaks.",
  },
  {
    label: "Start at login",
    checked: true,
    hint: "Keeps Varde running after a restart. Leave this on.",
  },
  SEP,
  {
    label: "Quit tray (Varde keeps running)",
    hint: "Hides only the icon. The service keeps running in the background.",
  },
];

export function TrayMenuMock({ hosting = false }: { hosting?: boolean }) {
  const [selected, setSelected] = useState<Item | null>(null);

  const items: (Item | typeof SEP)[] = [
    ...BASE_ITEMS.map((it) =>
      it === SEP || !hosting || it.label !== "Stop Varde service…"
        ? it
        : { ...it, enabled: false as const },
    ),
    ...(hosting ? HOSTING_ITEMS : []),
    ...TAIL_ITEMS,
  ];

  return (
    <figure className="my-8">
      <div className="mx-auto max-w-xs">
        {/* Fake taskbar corner */}
        <div className="mb-2 flex items-center justify-end gap-2 rounded-lg border border-separator bg-surface px-3 py-2">
          <span
            aria-hidden
            className={`block size-3 rounded-sm ${
              hosting ? "bg-glod" : "bg-surface-tertiary"
            }`}
            title={hosting ? "Hosting" : "Varde"}
          />
          <span className="text-xs text-muted">12:42</span>
        </div>
        {/* The menu */}
        <div className="rounded-lg border border-separator bg-surface-secondary p-1.5 shadow-xl">
          {items.map((it, i) =>
            it === SEP ? (
              <div key={i} className="mx-2 my-1 border-t border-separator" />
            ) : it.enabled === false ? (
              <div key={i} className="px-3 py-1.5 text-xs text-muted/70">
                {it.label}
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(it)}
                className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                  selected === it
                    ? "bg-surface-tertiary text-foreground"
                    : "text-foreground hover:bg-surface-tertiary"
                }`}
              >
                <span>{it.label}</span>
                {it.checked ? (
                  <span aria-hidden className="text-success">
                    ✓
                  </span>
                ) : null}
              </button>
            ),
          )}
        </div>
      </div>
      <figcaption
        aria-live="polite"
        className="mt-4 flex h-10 items-start justify-center text-center text-sm text-muted"
      >
        {selected?.hint ??
          (hosting
            ? "The ember icon means this PC is hosting right now. Click a menu item."
            : "Varde lives here, next to the clock. Click a menu item.")}
      </figcaption>
    </figure>
  );
}
