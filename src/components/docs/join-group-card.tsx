"use client";

import { Button, Card, Input, Label, TextField } from "@heroui/react";
import { useRef, useState } from "react";

import { cpFetch, LiveHint, useDocsCp } from "./live-primitives";

// "Join your friends' group" — the paste-an-invite step. For a signed-in
// reader this really joins the group behind the invite; signed out it is a
// static illustration of the dashboard field with a sign-in hint.

interface InvitePreview {
  code: string;
  group_name: string;
  uses: number;
  max_uses: number | null;
  expires_at: number | null;
}

// Accepts a bare code or a pasted invite link — same rule the dashboard uses.
function inviteCode(input: string): string {
  const t = input.trim();
  if (!t) return "";
  const last = t.split("/").filter(Boolean).pop() ?? "";
  return last;
}

export function JoinGroupCard() {
  const { status } = useDocsCp();
  const live = status === "live";

  const [value, setValue] = useState("");
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [joined, setJoined] = useState<string | null>(null);
  // Bumped on every edit — a stale lookup response can't resurrect a
  // preview for a code that's no longer in the field.
  const seq = useRef(0);

  const lookup = async () => {
    const code = inviteCode(value);
    if (!code) return;
    const mine = ++seq.current;
    setBusy(true);
    setErr(null);
    setInvite(null);
    try {
      const data = await cpFetch<{ invite: InvitePreview }>(
        `/api/cp/invites/${encodeURIComponent(code)}`,
      );
      if (mine === seq.current) setInvite(data.invite);
    } catch (e) {
      if (mine === seq.current) {
        setErr(
          e instanceof Error
            ? e.message
            : "That invite link is invalid or has expired",
        );
      }
    } finally {
      // Stale completions still release the button — the seq guard above
      // is what keeps them from writing preview/error state.
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!invite) return;
    const mine = seq.current;
    setBusy(true);
    setErr(null);
    try {
      await cpFetch(
        `/api/cp/invites/${encodeURIComponent(invite.code)}/accept`,
        { method: "POST", body: JSON.stringify({}) },
      );
      // The join happened even if the reader kept typing — tell them, but
      // leave an edited field alone. The consumed invite clears either way.
      setJoined(invite.group_name);
      setInvite(null);
      if (mine === seq.current) setValue("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join the group");
    } finally {
      setBusy(false);
    }
  };

  return (
    <figure className="my-6">
      <Card className="mx-auto max-w-sm rounded-xl border border-separator bg-surface p-5">
        {joined ? (
          <div className="py-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
              <span className="block size-2 rounded-full bg-success" />
              You joined {joined}
            </p>
            <p className="mt-2 text-xs text-muted">
              Its servers show up in your dashboard and in the app.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onPress={() => setJoined(null)}
            >
              Join another group
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">
              Join your friends&rsquo; group
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Paste the invite link they sent you — or just the code at the
              end.
            </p>
            <div className="mt-3">
              <TextField
                name="inviteLink"
                value={value}
                onChange={(v) => {
                  seq.current += 1;
                  setValue(v);
                  setInvite(null);
                  setErr(null);
                }}
                className="w-full"
                isDisabled={!live}
              >
                <Label>Invite link or code</Label>
                <Input placeholder="cp.varde.games/invite/x7k2m9" />
              </TextField>
            </div>

            {invite ? (
              <div className="mt-3 rounded-lg border border-glod/40 bg-glod/10 px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground">
                  Join {invite.group_name}?
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {invite.uses} joined so far
                  {invite.max_uses ? ` of up to ${invite.max_uses}` : ""}
                  {invite.expires_at
                    ? ` — expires ${new Date(invite.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : ""}
                </p>
              </div>
            ) : null}

            {err ? <p className="mt-2 text-xs text-danger">{err}</p> : null}

            <Button
              fullWidth
              className="mt-4"
              isDisabled={!live || busy || (!invite && !value.trim())}
              onPress={() => void (invite ? accept() : lookup())}
            >
              {busy
                ? invite
                  ? "Joining…"
                  : "Checking…"
                : invite
                  ? "Join group"
                  : "Check invite"}
            </Button>
          </>
        )}
      </Card>
      <figcaption className="mt-3 text-center text-sm text-muted">
        {joined
          ? "Done — you're in the group now."
          : live
            ? "Signed in: paste a real invite and you join for real."
            : "The dashboard's join field. Sample only — paste yours there."}
      </figcaption>
      <LiveHint status={status} />
    </figure>
  );
}
