// Fly volume/machine names: lowercase alnum + underscores, max 30 chars.
// grp_* ids are grp_ + 20 chars, so anchor_ + the suffix fits with room.
// Shared by the provisioner (which creates machines) and the bootstrap
// server (which looks them up by group id) — they must never drift.
export const machineName = (groupId: string) =>
  `anchor_${groupId.replace(/^grp_/, "")}`.slice(0, 30);
