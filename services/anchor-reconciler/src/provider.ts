// The only platform-specific surface in the reconciler. Swapping Fly.io for
// another host means a new AnchorProvider implementation; nothing above this
// file knows Fly exists. See docs/cloud-anchor.md.

export interface AnchorMachine {
  id: string;
  volumeId?: string;
  privateIp?: string; // 6PN address; bootstrap verifies callers against it
  status: string; // provider-native: created|started|stopped|destroyed|...
}

export interface CreateAnchorSpec {
  // Stable, provider-safe name for the machine — the group id is the natural
  // key so re-provision after destroy is idempotent by lookup.
  name: string;
  region: string;
  volumeGb: number;
  env: Record<string, string>; // e.g. VARDE_CP_URL, VARDE_ENROLL_TOKEN
}

export interface AnchorProvider {
  // Find the machine for this anchor, or null. Must be idempotent-safe:
  // called every reconcile pass.
  find(name: string): Promise<AnchorMachine | null>;
  create(spec: CreateAnchorSpec): Promise<AnchorMachine>;
  start(id: string): Promise<void>;
  stop(id: string): Promise<void>;
  destroy(id: string): Promise<void>;
  deleteVolume(volumeId: string): Promise<void>;
}
