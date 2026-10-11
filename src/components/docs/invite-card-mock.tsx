"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";

// Stylized mock of the invite link the dashboard hands out from Members >
// Invite friends. The copy button really copies.

const INVITE = "varde.games/invite/x7k2m9";

export function InviteCardMock() {
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${INVITE}`);
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied("idle"), 1500);
  };

  return (
    <figure className="my-6">
      <Card className="mx-auto max-w-sm rounded-xl border border-separator bg-surface p-5">
        <p className="text-sm font-semibold text-foreground">Invite link</p>
        <p className="mt-0.5 text-xs text-muted">
          Valid for 7 days, up to 10 people.
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-separator bg-surface-secondary px-3 py-2">
          <span className="truncate font-mono text-xs text-foreground">
            {INVITE}
          </span>
          <Button
            size="sm"
            onPress={() => void copy()}
            className="w-24 shrink-0"
          >
            {copied === "ok"
              ? "Copied"
              : copied === "err"
                ? "Copy failed"
                : "Copy"}
          </Button>
        </div>
      </Card>
      <figcaption className="mt-3 text-center text-sm text-muted">
        What your friends receive. This one is a sample, it will not join
        anything.
      </figcaption>
    </figure>
  );
}
