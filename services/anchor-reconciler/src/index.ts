// anchor-reconciler: desired-state loop for managed cloud anchors.
// Turso cloud_anchor rows (written by /api/anchors + Polar plan sync) are
// the source of truth; each pass drives one row toward its desired state
// through the AnchorProvider (Fly Machines) and the CP service token.
// See docs/cloud-anchor.md.
import { AnchorDb, type AnchorRow } from "./db";
import { CpClient } from "./cp";
import { FlyMachinesProvider } from "./fly";
import type { AnchorProvider } from "./provider";

const env = (k: string, dflt?: string): string => {
  const v = process.env[k] ?? dflt;
  if (v === undefined) throw new Error(`missing env ${k}`);
  return v;
};

const CP_URL = env("VARDE_CP_URL", "https://cp.varde.games").replace(/\/$/, "");
const REGION = env("ANCHOR_REGION", "arn");
const VOLUME_GB = Number(env("ANCHOR_VOLUME_GB", "10"));
const POLL_MS = Number(env("POLL_INTERVAL_MS", "15000"));
// Retry backoff: repeated failures park a row for a while instead of
// hammering the provider. attempts is bumped on every status write.
const MAX_BACKOFF_ATTEMPTS = 20;
// A machine that has not enrolled within this window never will: its
// enroll token has expired (or it crashed). Destroy it so the retry
// path provisions a fresh machine with a fresh token instead of
// waiting on a node that cannot appear.
const STUCK_PROVISION_MS = 30 * 60_000;

const wantsAnchor = (r: AnchorRow) =>
  r.desired === "provisioned" && (r.plan === "anchor" || r.plan === "anchor+");

// Machine name is the group id: unique, stable, and makes find() the
// idempotency key for re-provision.
const machineName = (r: AnchorRow) => `anchor-${r.group_id}`;

async function reconcile(r: AnchorRow, db: AnchorDb, cp: CpClient, provider: AnchorProvider) {
  if (r.error && r.attempts >= MAX_BACKOFF_ATTEMPTS && r.status === "error") {
    return; // parked until a human flips desired or raises the cap
  }
  if (wantsAnchor(r)) {
    await provision(r, db, cp, provider);
  } else {
    await teardown(r, db, cp, provider);
  }
}

async function provision(r: AnchorRow, db: AnchorDb, cp: CpClient, provider: AnchorProvider) {
  switch (r.status) {
    case "gone": // re-attach after full teardown
      await db.setStatus(r.id, "pending");
      return;
    case "pending": {
      // Adopt a machine from an earlier attempt (its create succeeded but
      // the status write failed) instead of leaking a second volume.
      const existing = await provider.find(machineName(r));
      if (existing) {
        await db.setStatus(r.id, "provisioning", {
          fly_machine_id: existing.id,
          fly_volume_id: existing.volumeId,
        });
        return;
      }
      const token = await cp.createAnchorEnrollToken(r.group_id);
      const m = await provider.create({
        name: machineName(r),
        region: REGION,
        volumeGb: VOLUME_GB,
        env: {
          VARDE_CP_URL: CP_URL,
          VARDE_ENROLL_TOKEN: token.token,
        },
      });
      await db.setStatus(r.id, "provisioning", {
        fly_machine_id: m.id,
        fly_volume_id: m.volumeId,
      });
      return;
    }
    case "provisioning": {
      // The agent enrolls with the token we baked into the machine env; a
      // managed anchor node appearing in the group is the success signal.
      // Correlation: Fly sets the VM hostname to the machine name and the
      // agent reports it at enroll, so the node name is anchor-<groupId>.
      const { nodes } = await cp.listNodes(r.group_id);
      const managed = nodes.find((n) => n.anchor && n.name === machineName(r));
      if (managed) {
        await db.setStatus(r.id, managed.online ? "online" : "provisioning", {
          node_id: managed.id,
        });
        return;
      }
      if (r.fly_machine_id && Date.now() - r.updated_at > STUCK_PROVISION_MS) {
        await provider.destroy(r.fly_machine_id);
        await db.setStatus(r.id, "error", {
          error: "agent did not enroll within 30m; reprovisioning",
        });
      }
      return;
    }
    case "online":
      return; // TODO(v1.5): suspend-on-idle once wake semantics are proven
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
  const m = await provider.find(machineName(r));
  if (m) await provider.destroy(m.id);
  if (r.node_id) {
    await cp.deleteNode(r.node_id).catch((e) => {
      // Node may already be gone; other errors surface via status=error.
      if (!String(e).includes("404")) throw e;
    });
  }
  // Volume deletion waits for the recovery grace window — handled by a
  // scheduled sweep, not this hot loop (kept as a status for now).
  await db.setStatus(r.id, "deprovisioning", { error: null });
  // TODO: volume retention grace (~14d read-only) then provider.deleteVolume
  // and status 'gone'. MVP: mark deprovisioning; manual volume cleanup.
}

async function main() {
  const db = new AnchorDb(env("TURSO_DATABASE_URL"), process.env.TURSO_AUTH_TOKEN);
  const cp = new CpClient(CP_URL, env("VARDE_CP_SERVICE_TOKEN"));
  const provider: AnchorProvider = new FlyMachinesProvider(
    env("FLY_API_TOKEN"),
    env("FLY_ANCHORS_APP", "varde-anchors"),
    env("ANCHOR_IMAGE"),
  );

  console.log(`anchor-reconciler: app=${env("FLY_ANCHORS_APP", "varde-anchors")} region=${REGION} poll=${POLL_MS}ms`);
  for (;;) {
    try {
      for (const row of await db.due()) {
        try {
          await reconcile(row, db, cp, provider);
        } catch (e) {
          await db
            .setStatus(row.id, "error", { error: String(e).slice(0, 500) })
            .catch(() => {});
          console.error(`anchor ${row.id} group ${row.group_id}:`, e);
        }
      }
    } catch (e) {
      console.error("reconcile pass failed:", e);
    }
    await new Promise((res) => setTimeout(res, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
