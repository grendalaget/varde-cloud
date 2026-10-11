"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Checkable step list for the quickstart guides. Readers tick items off as
// they go; progress lives in component state only (nothing is stored).

export function DocChecklist({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const [done, setDone] = useState<ReadonlySet<number>>(new Set());

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const count = done.size;
  const all = count === items.length;

  return (
    <figure className="my-6 rounded-xl border border-separator bg-surface p-4 sm:p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted" aria-live="polite">
          {all ? "All done" : `${count} of ${items.length}`}
        </p>
      </div>
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={count}
        aria-label="Checklist progress"
      >
        <motion.div
          className={`h-full rounded-full ${all ? "bg-success" : "bg-glod"}`}
          initial={false}
          animate={{ width: `${(count / items.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <ul className="space-y-1">
        {items.map((label, i) => {
          const checked = done.has(i);
          return (
            <li key={label}>
              <button
                type="button"
                aria-pressed={checked}
                onClick={() => toggle(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-surface-secondary ${
                  checked ? "text-muted" : "text-foreground"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors ${
                    checked
                      ? "border-success bg-success text-success-foreground"
                      : "border-separator bg-surface-secondary text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={checked ? "line-through" : ""}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
