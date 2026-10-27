// Desired-state logic for managed cloud anchors: each call drives one
// cloud_anchor row toward its desired state through the AnchorProvider
// (Fly Machines) and the CP service token. The poll loop lives in index.ts.
// See docs/cloud-anchor.md.
import { wantsAnchor, type AnchorDb, type AnchorRow } from "./db";
import type { CpClient } from "./cp";
import { machineName, volumeName } from "./names";
import type { AnchorProvider, AnchorVolume } from "./provider";

export const env = (k: string, dflt?: string): string => {
  const v = process.env[k] ?? dflt;
  if (v === undefined) throw new Error(`missing env ${k}`);
  return v;
};

export const CP_URL = env("VARDE_CP_URL", "https://cp.varde.games").replace(/\/$/, "");
export const REGION = env("ANCHOR_REGION", "arn");
const VOLUME_GB = Number(env("ANCHOR_VOLUME_GB", "10"));
const VOLUME_RETENTION_MS = Number(env("VOLUME_RETENTION_DAYS", "14")) * 24 * 60 * 60_000;
// Machines fetch their enroll token from this 6PN address at boot instead
// of carrying a CP credential in machine env (see src/bootstrap.ts).
export const BOOTSTRAP_PORT = Number(env("BOOTSTRAP_PORT", "8080"));
// <app>.internal resolves the whole app, so anchors keep reaching the
// bootstrap endpoint across reconciler redeploys (machine env is
// immutable; a stale machine-id URL would sit until the 30-min stuck
// timeout). If the reconciler ever shares an app, set BOOTSTRAP_HOST
// explicitly to <machine-id>.vm.<app>.internal.
const BOOTSTRAP_HOST = env(
  "BOOTSTRAP_HOST",
  process.env.FLY_APP_NAME
    ? `${process.env.FLY_APP_NAME}.internal`
    : "varde-anchor-reconciler.internal",
);
// Retry cap: repeated provisioning failures park a row instead of
// hammering the provider. attempts counts status writes since the row was
// last online (setStatus resets it there).
const MAX_BACKOFF_ATTEMPTS = 20;
// A machine that has not enrolled within this window never will: its
// enroll token has expired (or it crashed). Destroy it so the retry
// path provisions a fresh machine with a fresh token instead of
// waiting on a node that cannot appear.
const STUCK_PROVISION_MS = 30 * 60_000;

// Machine name derives from the group id (see src/names.ts): unique,
// stable, and makes find() the idempotency key for re-provision.
const rowMachineName = (r: AnchorRow) => machineName(r.group_id);

// A machine this young may have just been created by a row whose
// status write hasn't landed yet — an unclaimed destroy inside the
// window would kill an anchor mid-adoption. Past the window, unclaimed
// means genuinely orphaned.
const RECENT_MACHINE_MS = 120_000;
const isRecent = (m: { createdAt?: number }) =>
  m.createdAt !== undefined && Date.now() - m.createdAt < RECENT_MACHINE_MS;

// Consecutive members-check failures per row. A transient CP error must
// not burn the error/retry budget, but a permanent failure (e.g. the
// service token lost its members scope) has to become visible instead of
// leaving the row pending forever — past this streak the error is
// recorded normally, which eventually parks the row for a human.
const memberCheckFails = new Map<string, number>();
const MEMBER_CHECK_STREAK = 10;
const ONLINE_GRACE_PASSES = 4;
const offlineStreak = new Map<string, number>();

export const errorBackoffMs = (attempts: number) =>
  Math.min(1000 * 2 ** attempts, 15 * 60_000);

export async function reconcile(r: AnchorRow, db: AnchorDb, cp: CpClient, provider: AnchorProvider) {
  const want = wantsAnchor(r);
  // Parking only stops provisioning: a cancel or detach must still tear
  // the machine down, or it runs unpaid forever.
  if (want && r.error && r.attempts >= MAX_BACKOFF_ATTEMPTS && r.status === "error") {
    return; // parked until a human flips desired or raises the cap
  }
  if (r.status === "error" && Date.now() - r.updated_at < errorBackoffMs(r.attempts)) {
    return;
  }
  // The anchor serves the group but is billed to the subscriber: if they
  // are no longer a group admin, tear it down. A members-list failure
  // skips this pass without a status write — the row keeps its state and
  // retries next poll instead of burning its error/retry budget on a
  // transient CP error.
  let admin: boolean | null = false;
  if (want) {
    try {
      admin = await cp.isGroupAdmin(r.group_id, r.email);
    } catch (e) {
      const streak = (memberCheckFails.get(r.id) ?? 0) + 1;
      memberCheckFails.set(r.id, streak);
      if (streak >= MEMBER_CHECK_STREAK) {
        memberCheckFails.delete(r.id);
        throw new Error(`group members check failing persistently (${streak}x): ${e}`);
      }
      console.warn(`anchor ${r.id} group ${r.group_id}: members check failed (${streak}x), skipping:`, e);
      admin = null;
    }
  }
  if (admin === null) return;
  memberCheckFails.delete(r.id);
  if (want && admin) {
    await provision(r, db, cp, provider);
  } else if (r.status !== "deprovisioning" && r.status !== "gone") {
    // A torn-down row is settled: a former admin's paid row still looks
    // due (desired=provisioned + paid plan), and without this guard it
    // would re-run teardown — and re-label the replacement's machine an
    // orphan — every poll forever.
    await teardown(r, db, cp, provider);
  }
}

async function provision(r: AnchorRow, db: AnchorDb, cp: CpClient, provider: AnchorProvider) {
  // Two paid rows on one group would fight over the group-derived machine
  // name (adopt-or-create keys on it). Only a row still trying to acquire
  // infra yields: once a row owns a machine it is the anchor of record —
  // an online/provisioning row must never park itself for a mere pending
  // sibling, or the sibling would adopt the still-running machine and the
  // parked row's later teardown would destroy a machine another
  // subscriber pays for. 'conflict' is not a live sibling, so two rows
  // parked against each other resolve on the next pass.
  if (r.status !== "online" && r.status !== "provisioning") {
    const sibling = await db.liveSiblingAnchor(r.group_id, r.id);
    if (sibling) {
      if (r.status !== "conflict") {
        await db.setStatus(r.id, "conflict", {
          error: `another anchor is already attached to this group (row ${sibling.id})`,
        });
      }
      return;
    }
    // One anchor per `anchor` subscription, enforced before any machine
    // exists (rows already online predate the limit and are left alone).
    const blocker = r.plan === "anchor" ? await db.blockingAnchorOfUser(r) : null;
    if (blocker) {
      if (r.status !== "conflict") {
        await db.setStatus(r.id, "conflict", {
          error: `plan covers one anchor; row ${blocker} already holds it`,
        });
      }
      return;
    }
  }
  switch (r.status) {
    case "gone": // re-attach after full teardown
      await db.setStatus(r.id, "pending");
      return;
    case "pending": {
      // Adopt a machine from an earlier attempt (its create succeeded but
      // the status write failed) instead of leaking a second volume.
      const existing = await provider.find(rowMachineName(r));
      if (existing) {
        // Only adopt a machine provably created for this row: the
        // VARDE_ANCHOR_ROW tag is the ownership proof — the group-derived
        // name alone can't distinguish a sibling subscriber's machine,
        // and an untagged machine must never be claimed on name alone.
        if (existing.rowId !== r.id) {
          await db.setStatus(r.id, "conflict", {
            error: existing.rowId
              ? `machine ${existing.id} belongs to anchor row ${existing.rowId}`
              : `machine ${existing.id} has no row ownership tag`,
          });
          return;
        }
        await db.setStatus(r.id, "provisioning", {
          fly_machine_id: existing.id,
          fly_volume_id: existing.volumeId,
        });
        return;
      }
      const m = await provider.create({
        name: rowMachineName(r),
        groupId: r.group_id,
        region: REGION,
        volumeGb: VOLUME_GB,
        env: {
          VARDE_CP_URL: CP_URL,
          VARDE_ANCHOR_ROW: r.id,
          VARDE_BOOTSTRAP_URL: `http://${BOOTSTRAP_HOST}:${BOOTSTRAP_PORT}/bootstrap/${r.group_id}`,
        },
      });
      await db.setStatus(r.id, "provisioning", {
        fly_machine_id: m.id,
        fly_volume_id: m.volumeId,
      });
      return;
    }
    case "provisioning": {
      // The agent enrolls with the token it fetched from bootstrap; a
      // managed anchor node appearing in the group is the success signal.
      // Correlation: Fly sets the VM hostname to the machine ID (not the
      // machine name) and the agent reports it at enroll — observed
      // node.name = 8901e1b64320d8 — so match on fly_machine_id.
      const { nodes } = await cp.listNodes(r.group_id);
      const managed = nodes.find(
        (n) => n.anchor && r.fly_machine_id && n.name === r.fly_machine_id,
      );
      if (managed?.online) {
        await db.setStatus(r.id, "online", { node_id: managed.id, error: null });
        return;
      }
      // Track the node's id only while it is offline: rewriting the row
      // each poll would refresh updated_at and keep an enrolled-but-
      // offline anchor from ever reaching the stuck timeout below. Still
      // adopt a different node id — a reprovisioned machine enrolls a
      // new node while the old id points at a dead one.
      if (managed && r.node_id !== managed.id) {
        await db.setStatus(r.id, "provisioning", { node_id: managed.id });
        return;
      }
      if (Date.now() - r.updated_at > STUCK_PROVISION_MS) {
        // No usable node within the window: the enroll token expired, the
        // machine never booted, or the agent enrolled then died. Rebuild
        // the machine but keep the volume: a re-attach or a once-online
        // anchor has chunks on it, and create() reuses it by name.
        if (r.fly_machine_id) await provider.destroy(r.fly_machine_id);
        if (managed) {
          try {
            await cp.deleteNode(managed.id);
          } catch {}
        }
        if (r.node_id) {
          try {
            await cp.deleteNode(r.node_id);
          } catch {}
        }
        await db.setStatus(r.id, "error", {
          fly_machine_id: null,
          fly_volume_id: null,
          node_id: null,
          error: "anchor not online within 30m; reprovisioning",
        });
      }
      return;
    }
    case "conflict": {
      // Resume only when the obstruction is gone: the sibling row has
      // left (checked above) AND no foreign machine still holds the
      // group-derived name. An unclaimed machine holding the name is an
      // orphan — destroy it and the row resumes itself; a machine a live
      // row claims is the anchor someone else pays for, so keep parked.
      const blocking = await provider.find(rowMachineName(r));
      if (blocking && blocking.rowId !== r.id) {
        if (!isRecent(blocking) && !(await db.machineClaimed(r.group_id, r.id, blocking.id))) {
          await provider.destroy(blocking.id);
        }
        return;
      }
      await db.setStatus(r.id, "pending");
      return;
    }
    case "online": {
      // Re-verify every pass: the dashboard shows this status to players.
      // A missing or offline node drops back to provisioning, whose stuck
      // timeout rebuilds the machine if it does not return.
      // TODO(v1.5): suspend-on-idle once wake semantics are proven
      const { nodes } = await cp.listNodes(r.group_id);
      if (nodes.find((n) => n.id === r.node_id)?.online) {
        offlineStreak.delete(r.id);
      } else {
        const streak = (offlineStreak.get(r.id) ?? 0) + 1;
        offlineStreak.set(r.id, streak);
        if (streak >= ONLINE_GRACE_PASSES) {
          offlineStreak.delete(r.id);
          await db.setStatus(r.id, "provisioning");
        }
      }
      return;
    }
    case "error":
      // A single transient failure must not strand a paid anchor; the
      // attempts counter still parks it after repeated failures.
      await db.setStatus(r.id, "pending");
      return;
    default:
      await db.setStatus(r.id, "pending");
  }
}

async function teardown(r: AnchorRow, db: AnchorDb, cp: CpClient, provider: AnchorProvider) {
  if (r.status === "gone") return;
  // Destroy every machine this row may own: the recorded id plus a
  // same-named machine — but a same-named machine only when no live row
  // claims its id. A claimed machine is the running anchor another
  // subscriber pays for; an unclaimed one (untagged, or tagged for a
  // torn-down row) is an orphan that would otherwise leak forever.
  const ids = new Set<string>();
  if (r.fly_machine_id) ids.add(r.fly_machine_id);
  const m = await provider.find(rowMachineName(r));
  let deferSettle = false;
  if (m && m.rowId === r.id) {
    ids.add(m.id);
  } else if (m && !(await db.machineClaimed(r.group_id, r.id, m.id))) {
    // Unclaimed: destroy once past the adoption window; younger than
    // that it may be mid-adoption, so hold the deprovisioning write —
    // settling now would stop teardown passes and leak it forever.
    if (isRecent(m)) deferSettle = true;
    else ids.add(m.id);
  }
  for (const id of ids) await provider.destroy(id);
  if (r.node_id) {
    try {
      await cp.deleteNode(r.node_id);
    } catch (e) {
      // Node may already be gone; other errors surface via status=error.
      if (!String(e).includes("404")) throw e;
    }
  }
  // Volume deletion waits for the recovery grace window — handled by a
  // scheduled sweep, not this hot loop (kept as a status for now).
  if (deferSettle) return; // revisit the recent machine next pass
  await db.setStatus(r.id, "deprovisioning", { error: null });
}

export async function sweepVolumes(
  db: AnchorDb,
  provider: AnchorProvider,
  now = Date.now(),
): Promise<void> {
  const cutoffMs = now - VOLUME_RETENTION_MS;
  const rows = await db.expiredTeardowns(cutoffMs);
  for (const r of rows) {
    try {
      if (await db.volumeInUse(r.group_id, r.id, cutoffMs)) {
        await db.claimSwept(r.id, r.updated_at);
        continue;
      }
      const volumes: AnchorVolume[] = await provider.findVolumes(volumeName(r.group_id));
      if (volumes.some((volume) => volume.attachedMachineId)) {
        console.warn(
          `anchor ${r.id} group ${r.group_id}: retained volume is still attached; skipping volume sweep`,
        );
        continue;
      }
      if (!(await db.claimSwept(r.id, r.updated_at))) continue;
      try {
        for (const volume of volumes) await provider.deleteVolume(volume.id);
      } catch (e) {
        try {
          await db.unclaimSwept(r.id, r.updated_at);
        } catch (unclaimError) {
          console.error(
            `anchor ${r.id} group ${r.group_id}: failed to restore teardown after volume deletion error:`,
            unclaimError,
          );
        }
        throw e;
      }
    } catch (e) {
      console.error(`anchor ${r.id} group ${r.group_id}: volume sweep failed:`, e);
    }
  }
}
