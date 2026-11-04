// anchor-reconciler: desired-state loop for managed cloud anchors.
// Turso cloud_anchor rows (written by /api/anchors + Polar plan sync) are
// the source of truth; each pass hands every due row to reconcile().
// See docs/cloud-anchor.md.
import { AnchorDb } from "./db";
import { CpClient } from "./cp";
import { FlyMachinesProvider } from "./fly";
import { startBootstrap } from "./bootstrap";
import type { AnchorProvider } from "./provider";
import { BOOTSTRAP_PORT, CP_URL, env, reconcile, REGION, sweepVolumes } from "./reconcile";

const POLL_MS = Number(env("POLL_INTERVAL_MS", "15000"));
const VOLUME_SWEEP_INTERVAL_MS = 60 * 60_000;

async function main() {
  const db = new AnchorDb(env("TURSO_DATABASE_URL"), process.env.TURSO_AUTH_TOKEN);
  const cp = new CpClient(CP_URL, env("VARDE_CP_SERVICE_TOKEN"));
  const provider: AnchorProvider = new FlyMachinesProvider(
    env("FLY_API_TOKEN"),
    env("FLY_ANCHORS_APP", "varde-anchors"),
    env("ANCHOR_IMAGE"),
  );
  startBootstrap(db, cp, provider, CP_URL, BOOTSTRAP_PORT);

  console.log(`anchor-reconciler: app=${env("FLY_ANCHORS_APP", "varde-anchors")} region=${REGION} poll=${POLL_MS}ms`);
  let lastVolumeSweep = Date.now();
  try {
    await sweepVolumes(db, provider);
  } catch (e) {
    console.error("volume sweep failed:", e);
  }
  for (;;) {
    try {
      for (const row of await db.due()) {
        try {
          await reconcile(row, db, cp, provider);
        } catch (e) {
          try {
            await db.setStatus(row.id, "error", { error: String(e).slice(0, 500) });
          } catch {}
          console.error(`anchor ${row.id} group ${row.group_id}:`, e);
        }
      }
    } catch (e) {
      console.error("reconcile pass failed:", e);
    }
    const now = Date.now();
    if (now - lastVolumeSweep >= VOLUME_SWEEP_INTERVAL_MS) {
      lastVolumeSweep = now;
      try {
        await sweepVolumes(db, provider);
      } catch (e) {
        console.error("volume sweep failed:", e);
      }
    }
    await new Promise((res) => setTimeout(res, POLL_MS));
  }
}

void (async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
