// The only platform-specific surface in the reconciler. Swapping Fly.io for
// another host means a new AnchorProvider implementation; nothing above this
// file knows Fly exists. See docs/cloud-anchor.md.

export interface AnchorMachine {
  id: string;
  volumeId?: string;
  privateIp?: string; // 6PN address; bootstrap verifies callers against it
  status: string; // provider-native: created|started|stopped|destroyed|...
  // The cloud_anchor row id the machine was created for (carried in its
  // env as VARDE_ANCHOR_ROW). Ownership check for adopt/teardown: group-
  // derived names can't distinguish a sibling subscriber's machine.
  rowId?: string;
  // Creation timestamp (ms). A machine younger than the record window
  // may be mid-adoption — its row's status write hasn't landed yet.
  createdAt?: number;
}

export interface AnchorVolume {
  id: string;
  attachedMachineId?: string;
}

export interface CreateAnchorSpec {
  // Stable, provider-safe name for the machine — the group id is the natural
  // key so re-provision after destroy is idempotent by lookup.
  name: string;
  groupId: string;
  region: string;
  volumeGb: number;
  env: Record<string, string>; // e.g. VARDE_CP_URL, VARDE_ENROLL_TOKEN
}

export interface AnchorProvider {
  // Find the machine for this anchor, or null. Must be idempotent-safe:
  // called every reconcile pass.
  find(name: string): Promise<AnchorMachine | null>;
  findVolumes(name: string): Promise<AnchorVolume[]>;
  create(spec: CreateAnchorSpec): Promise<AnchorMachine>;
  destroy(id: string): Promise<void>;
  deleteVolume(volumeId: string): Promise<void>;
}
