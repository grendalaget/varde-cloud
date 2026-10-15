"use client";

import { Button, Card } from "@heroui/react";
import { useState } from "react";

import {
  cpFetch,
  CreateGroupInline,
  GroupField,
  LiveHint,
  useDocsCp,
} from "./live-primitives";

// The invite link the dashboard hands out from Members > Invite friends.
// Signed-in readers mint a real invite for their group here; everyone else
// sees a static sample plus a quiet sign-in hint.

interface RealInvite {
  code: string;
  group_name: string;
  url: string;
  expires_at: number | null;
  max_uses: number | null;
  uses: number;
}

const SAMPLE = "cp.varde.games/invite/x7k2m9";

export function InviteCardMock() {
  const { status, groups, refresh } = useDocsCp();
  const live = status === "live";

  const [groupId, setGroupId] = useState("");
  const [invite, setInvite] = useState<RealInvite | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "ok" | "err">("idle");

  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  const create = async () => {
    if (!group) return;
    setBusy(true);
    setErr(null);
    try {
      const data = await cpFetch<{ invite: RealInvite }>(
        `/api/cp/groups/${encodeURIComponent(group.id)}/invites`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setInvite(data.invite);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create the invite");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied("idle"), 1500);
  };

  const shown =
    live && invite
      ? invite.url.replace(/^https?:\/\//, "")
      : live
        ? "cp.varde.games/invite/x7k2m9"
        : SAMPLE;
  const liveInvite = live && invite;

  return (
    <figure className="my-6">
      <Card className="mx-auto max-w-sm rounded-xl border border-separator bg-surface p-5">
        <p className="text-sm font-semibold text-foreground">Invite link</p>
        <p className="mt-0.5 text-xs text-muted">
          {liveInvite
            ? `For ${invite.group_name}: ${
                invite.expires_at
                  ? `valid until ${new Date(invite.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : "no expiry"
              }${invite.max_uses ? `, up to ${invite.max_uses} people` : ""}.`
            : "Valid for 7 days, up to 10 people."}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-separator bg-surface-secondary px-3 py-2">
          <span className="truncate font-mono text-xs text-foreground">
            {shown}
          </span>
          <Button
            size="sm"
            onPress={() => void copy(liveInvite ? invite.url : `https://${SAMPLE}`)}
            isDisabled={live ? !invite : false}
            className="w-24 shrink-0"
          >
            {copied === "ok"
              ? "Copied"
              : copied === "err"
                ? "Copy failed"
                : "Copy"}
          </Button>
        </div>

        {live && !invite ? (
          groups.length === 0 ? (
            <div className="mt-4">
              <CreateGroupInline onCreated={() => refresh()} />
            </div>
          ) : (
            <>
              {groups.length > 1 ? (
                <div className="mt-4">
                  <GroupField
                    groups={groups}
                    value={group?.id ?? ""}
                    onChange={setGroupId}
                  />
                </div>
              ) : null}
              <Button
                fullWidth
                className="mt-4"
                isDisabled={busy}
                onPress={() => void create()}
              >
                {busy ? "Creating" : `Create an invite for ${group?.name}`}
              </Button>
            </>
          )
        ) : null}

        {live && invite ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 underline underline-offset-2"
            onPress={() => setInvite(null)}
          >
            Make another
          </Button>
        ) : null}

        {err ? <p className="mt-2 text-xs text-danger">{err}</p> : null}
      </Card>
      <figcaption className="mt-3 text-center text-sm text-muted">
        {liveInvite
          ? "That's a real invite: send it to your friends and they're in."
          : live
            ? "Signed in: this mints a real invite for your group."
            : "What your friends receive. Sample only: it joins nothing."}
      </figcaption>
      <LiveHint status={status} />
    </figure>
  );
}
