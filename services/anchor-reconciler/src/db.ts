// Turso access for the desired-state table the site writes
// (src/db/schema.ts cloud_anchor + the better-auth user.plan it joins on).
import { createClient, type Client } from "@libsql/client";

export interface AnchorRow {
  id: string;
  user_id: string;
  group_id: string;
  desired: string; // provisioned | detached
  status: string; // pending | provisioning | online | deprovisioning | gone | error | conflict
  fly_machine_id: string | null;
  fly_volume_id: string | null;
  node_id: string | null;
  error: string | null;
  attempts: number;
  created_at: number;
  updated_at: number;
  plan: string; // joined from user.plan
  email: string; // joined from user.email — CP members are matched by email
}

// A row only wants its anchor while the subscription still includes one:
// desired is user intent, plan is the live entitlement. Cancel/revoke
// flips plan to free and teardown follows without touching desired.
export const wantsAnchor = (r: AnchorRow) =>
  r.desired === "provisioned" && (r.plan === "anchor" || r.plan === "anchor+");

export class AnchorDb {
  private client: Client;

  constructor(url: string, authToken?: string) {
    this.client = createClient({ url, authToken });
  }

  // Effective desired state: a row only wants an anchor while the user's
  // plan still includes one. Cancel/revoke flips plan to free and the
  // reconciler tears the anchor down without touching `desired` — a
  // re-subscribed user can re-attach cleanly.
  async due(): Promise<AnchorRow[]> {
    const res = await this.client.execute(`
      SELECT a.*, u.plan AS plan, u.email AS email
      FROM cloud_anchor a
      JOIN user u ON u.id = a.user_id
      WHERE (a.desired = 'provisioned' AND u.plan IN ('anchor','anchor+'))
         OR (a.status NOT IN ('gone','deprovisioning'))
    `);
    return res.rows as unknown as AnchorRow[];
  }

  async expiredTeardowns(cutoffMs: number): Promise<AnchorRow[]> {
    const res = await this.client.execute({
      sql: `SELECT a.*, u.plan AS plan, u.email AS email
            FROM cloud_anchor a
            JOIN user u ON u.id = a.user_id
            WHERE a.status = 'deprovisioning' AND a.updated_at < ?`,
      args: [cutoffMs],
    });
    return res.rows as unknown as AnchorRow[];
  }

  async claimSwept(id: string, observedUpdatedAt: number): Promise<boolean> {
    const res = await this.client.execute({
      sql: `UPDATE cloud_anchor
            SET status = 'gone', fly_volume_id = NULL, updated_at = ?
            WHERE id = ? AND status = 'deprovisioning' AND updated_at = ?`,
      args: [Date.now(), id, observedUpdatedAt],
    });
    return res.rowsAffected === 1;
  }

  async unclaimSwept(id: string, originalUpdatedAt: number): Promise<void> {
    await this.client.execute({
      sql: `UPDATE cloud_anchor
            SET status = 'deprovisioning', updated_at = ?
            WHERE id = ? AND status = 'gone'`,
      args: [originalUpdatedAt, id],
    });
  }

  async volumeInUse(groupId: string, excludeId: string, cutoffMs: number): Promise<boolean> {
    const res = await this.client.execute({
      sql: `SELECT 1 FROM cloud_anchor
            WHERE group_id = ? AND id != ? AND status != 'gone'
              AND (status != 'deprovisioning' OR updated_at >= ?)
            LIMIT 1`,
      args: [groupId, excludeId, cutoffMs],
    });
    return res.rows.length > 0;
  }

  // The row a bootstrap request acts on: the live provisioned anchor for
  // a group. Detached/deprovisioning rows from an earlier anchor must not
  // shadow a replacement, so filter to the active one explicitly.
  async rowByGroup(groupId: string): Promise<AnchorRow | null> {
    const res = await this.client.execute({
      sql: `SELECT a.*, u.plan AS plan, u.email AS email FROM cloud_anchor a
            JOIN user u ON u.id = a.user_id
            WHERE a.group_id = ? AND a.desired = 'provisioned'
              AND a.status NOT IN ('gone','deprovisioning','conflict')
            ORDER BY a.updated_at DESC LIMIT 1`,
      args: [groupId],
    });
    return (res.rows[0] as unknown as AnchorRow) ?? null;
  }

  // Another subscriber's converging anchor on the same group. Provision
  // and teardown check this before touching machines: machine names are
  // group-derived, so two live rows would fight over (and destroy) the
  // same machine. 'conflict' rows are deliberately excluded — a parked
  // row must not block the surviving row, and two simultaneous conflicts
  // resolve themselves on the next pass.
  async liveSiblingAnchor(
    groupId: string,
    excludeId: string,
  ): Promise<AnchorRow | null> {
    const res = await this.client.execute({
      sql: `SELECT a.*, u.plan AS plan, u.email AS email FROM cloud_anchor a
            JOIN user u ON u.id = a.user_id
            WHERE a.group_id = ? AND a.id != ? AND a.desired = 'provisioned'
              AND a.status NOT IN ('gone','deprovisioning','conflict')
            LIMIT 1`,
      args: [groupId, excludeId],
    });
    return (res.rows[0] as unknown as AnchorRow) ?? null;
  }

  // The subscriber's other anchor that outranks this row, if any. The
  // `anchor` plan covers one anchor and /api/anchors checks that, but two
  // concurrent attaches can both pass; this loop is sequential, so it is
  // the authoritative check. A row that already holds a machine always
  // wins; otherwise the oldest non-torn-down row does, whatever its state —
  // skipping parked rows would let a newer row provision, then the older
  // one once its obstruction clears.
  async blockingAnchorOfUser(r: AnchorRow): Promise<string | null> {
    const res = await this.client.execute({
      sql: `SELECT id FROM cloud_anchor
            WHERE user_id = ? AND group_id != ? AND desired = 'provisioned'
              AND status NOT IN ('gone','deprovisioning')
              AND (status IN ('online','provisioning')
                   OR created_at < ? OR (created_at = ? AND id < ?))
            LIMIT 1`,
      args: [r.user_id, r.group_id, r.created_at, r.created_at, r.id],
    });
    return (res.rows[0]?.id as string | undefined) ?? null;
  }

  // Does any live row claim this machine id? The strongest ownership
  // proof available: a row only records fly_machine_id after a
  // tag-verified adopt or its own create. Torn-down rows (gone /
  // deprovisioning) no longer count — their recorded ids point at
  // machines they already released.
  async machineClaimed(
    groupId: string,
    excludeId: string,
    machineId: string,
  ): Promise<boolean> {
    const res = await this.client.execute({
      sql: `SELECT 1 FROM cloud_anchor
            WHERE group_id = ? AND id != ? AND fly_machine_id = ?
              AND status NOT IN ('gone','deprovisioning')
            LIMIT 1`,
      args: [groupId, excludeId, machineId],
    });
    return res.rows.length > 0;
  }

  async setStatus(
    id: string,
    status: string,
    patch: Partial<
      Pick<AnchorRow, "fly_machine_id" | "fly_volume_id" | "node_id" | "error">
    > = {},
  ): Promise<void> {
    // Absent keys keep their column value; explicit null clears it —
    // COALESCE-style updates can't express that distinction.
    // attempts counts writes since the row was last online, so a long-lived
    // anchor's history of transient errors never parks it.
    const sets = [
      "status = ?",
      "error = ?",
      status === "online" ? "attempts = 0" : "attempts = attempts + 1",
      "updated_at = ?",
    ];
    const args: (string | number | null)[] = [
      status,
      patch.error ?? null,
      Date.now(),
    ];
    if ("fly_machine_id" in patch) {
      sets.push("fly_machine_id = ?");
      args.push(patch.fly_machine_id ?? null);
    }
    if ("fly_volume_id" in patch) {
      sets.push("fly_volume_id = ?");
      args.push(patch.fly_volume_id ?? null);
    }
    if ("node_id" in patch) {
      sets.push("node_id = ?");
      args.push(patch.node_id ?? null);
    }
    args.push(id);
    await this.client.execute({
      sql: `UPDATE cloud_anchor SET ${sets.join(", ")} WHERE id = ?`,
      args,
    });
  }
}
