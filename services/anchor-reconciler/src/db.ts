// Turso access for the desired-state table the site writes
// (src/db/schema.ts cloud_anchor + the better-auth user.plan it joins on).
import { createClient, type Client } from "@libsql/client";

export interface AnchorRow {
  id: string;
  user_id: string;
  group_id: string;
  desired: string; // provisioned | detached
  status: string; // pending | provisioning | online | deprovisioning | gone | error
  fly_machine_id: string | null;
  fly_volume_id: string | null;
  node_id: string | null;
  error: string | null;
  attempts: number;
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

  // The row a bootstrap request acts on: the live provisioned anchor for
  // a group. Detached/deprovisioning rows from an earlier anchor must not
  // shadow a replacement, so filter to the active one explicitly.
  async rowByGroup(groupId: string): Promise<AnchorRow | null> {
    const res = await this.client.execute({
      sql: `SELECT a.*, u.plan AS plan, u.email AS email FROM cloud_anchor a
            JOIN user u ON u.id = a.user_id
            WHERE a.group_id = ? AND a.desired = 'provisioned'
              AND a.status NOT IN ('gone','deprovisioning')
            ORDER BY a.updated_at DESC LIMIT 1`,
      args: [groupId],
    });
    return (res.rows[0] as unknown as AnchorRow) ?? null;
  }

  async setStatus(
    id: string,
    status: string,
    patch: Partial<
      Pick<AnchorRow, "fly_machine_id" | "fly_volume_id" | "node_id" | "error">
    > = {},
  ): Promise<void> {
    await this.client.execute({
      sql: `UPDATE cloud_anchor
            SET status = ?, fly_machine_id = COALESCE(?, fly_machine_id),
                fly_volume_id = COALESCE(?, fly_volume_id),
                node_id = COALESCE(?, node_id), error = ?,
                attempts = attempts + 1, updated_at = ?
            WHERE id = ?`,
      args: [
        status,
        patch.fly_machine_id ?? null,
        patch.fly_volume_id ?? null,
        patch.node_id ?? null,
        patch.error ?? null,
        Date.now(),
        id,
      ],
    });
  }
}
