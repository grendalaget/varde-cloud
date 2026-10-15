# Managed cloud anchors

Status: proposed
Date: 2026-10-15

## Summary

The first paid product: a managed **cloud anchor** a customer can attach to
one of their groups on varde.games. A cloud anchor is an always-available
anchor node we run on Fly.io Machines, enrolled into the customer's group on
the hosted control plane (cp.varde.games). It holds the latest committed
save so progress survives the "everyone is offline" case.

This doc covers the product shape, the component boundaries, the trust
model, and the cost model. It does not cover OSS-repo internals beyond what
the feature needs from them.

## Product shape

- `anchor` plan: one cloud anchor attachable to one group the customer owns
  or admins. One anchor per group. Monthly and yearly billing via Polar
  (merchant of record, VAT handled).
- `anchor+` is reserved in the plan model (multi-group, larger storage,
  region choice) but is not part of the launch.
- Launch price: 3.99 (see the cost model for why 2.99 does not work yet).
- Group admins see the anchor as a normal node in the dashboard and can
  remove it; they cannot edit it (it is owned by the service).

## Components and repo boundaries

| Piece | Repo | Notes |
| --- | --- | --- |
| Service tokens + anchor enrollment | `grendalaget/varde` (OSS) | Generic capability: `vst_` bearer tokens scoped to enrollment/node operations. Any self-hoster can automate anchors with it. No billing concepts in the OSS repo. |
| Entitlement + UI | `grendalaget/varde-cloud` | Polar webhook -> plan -> desired anchor state in Turso. Group page "cloud anchor" card. |
| Reconciler | `grendalaget/varde-cloud` `services/anchor-reconciler` | Desired-state loop: Turso -> Fly Machines API + CP service token -> status back to Turso. |
| Anchor machines | Fly.io | One Machine per subscribed group in a `varde-anchors` app, volume per machine, no public services. |

### Purchase to provisioned

1. Polar webhook (`subscription.active`) -> `user.plan = "anchor"` and a row
   in `cloud_anchors` with `desired = 'provisioning'` for the chosen group.
2. Reconciler picks up the row: creates a Fly Machine + volume in
   `varde-anchors`, asks the CP for a one-use enrollment token
   (`anchor: true`) via the service token, boots the agent with
   `VARDE_ENROLL_TOKEN` + `VARDE_CP_URL` in its env.
3. Agent enrolls, heartbeats show it online on the group, reconciler marks
   `actual = 'online'`. Site reads the same row for status.

### Cancellation

- `subscription.canceled` / revoked -> `desired = 'deprovision'` at period
  end. `require_anchor_for_commit` is unset on the group immediately so a
  lapsed subscription never blocks saves.
- Volume retained ~14 days (read-only recovery window), then deleted.
  Player machines still hold copies; the anchor is a replica, not primary.

## Suspend on idle

An anchor only needs to be alive while the group's server is running, plus a
grace window for final replication. The reconciler (later: the CP) stops the
Machine when the group has been idle past the grace window and starts it
when a server is scheduled. Machines bill per second; stopped machines cost
only rootfs (~$0.30/mo). Friend-group servers are probably online a third to
half the month, so this roughly halves compute.

v1 ships always-on to keep the semantics simple: `require_anchor_for_commit`
needs the anchor reachable whenever a server runs, and an anchor that is
slow to wake can briefly block commits. Suspend-on-idle is v1.5 once wake
latency and the "server stopping before anchor caught up" edge are
exercised.

## Trust model

- The reconciler authenticates to the CP with a **service token** (`vst_…`,
  hashed at rest, scoped). Scopes: `enroll` (enrollment-token CRUD on any
  group) and `nodes` (node read/delete for lifecycle). Service tokens are
  minted by an operator with `varde-control-plane service-token create` and
  are auditable in `audit_log` under `service:<name>`. This is deliberately
  narrow: it cannot touch users, groups, servers, or billing.
- Anchor machines get a one-use enrollment token at create time via env.
  The token expires unused; the enrolled node gets a normal node identity.
- No public ingress on anchor Machines: no Fly `services` config, no
  anycast IP. Outbound QUIC to peers plus relay fallback, CP traffic over
  6PN (`.internal`).
- `varde-cloud` stays public: all credentials are env secrets, and the CP
  service-token surface is designed to be reviewed, not hidden.

## Cost model (Fly list prices, arn region)

| Item | Cost |
| --- | --- |
| shared-cpu-1x 256MB, always on | ~$2.28/mo (1.038 region multiplier) |
| 10GB volume | $1.50/mo |
| 20GB volume | $3.00/mo |
| Stopped machine | ~$0.15/GB rootfs only (~$0.30) |
| Egress to players (restore traffic) | from $0.02/GB |
| Anchor <-> CP over 6PN | free |

| Model | Cost per anchor / mo | Margin @ 3.99 |
| --- | --- | --- |
| Always-on + 10GB volume | ~$3.78 | ~5% |
| Suspended ~40% duty + volume | ~$2.70 | ~32% |
| Tigris-backed chunk store | ~$2.40 | ~40% |
| Serverless chunks (agents write Tigris directly) | ~$0.40 | ~90% |

Fixed fleet cost: the reconciler itself (~$2.28/mo) plus the existing CP.

## Trajectory

- **v1**: always-on per-group Machine + volume. Zero agent changes, fastest
  to a sellable product. Thin margin; price at 3.99.
- **v1.5**: suspend-on-idle once wake semantics are proven.
- **v2**: Tigris (S3-compatible, $0.02/GB, free egress) as the anchor chunk
  backend behind the snapshot-store interface. Cuts storage ~7x.
- **v3**: serverless chunks. Hosts write chunks to Tigris directly with
  scoped credentials from the CP; the anchor VM disappears. This is where
  the ~$2-3/mo price point becomes viable. Needs fencing/consistency work
  in the CP, so it is a direction, not a launch commitment.

## Open technical items

- Restore path for outbound-only anchors: if a player machine cannot reach
  the anchor directly, restore traffic flows through our relay (our egress
  cost). Verify mesh reachability of anchors-behind-Fly-NAT before launch;
  a dedicated IPv4 per anchor is $2/mo and kills the margin, so prefer
  tuning the relay path.
- Quota enforcement: storage cap per anchor enforced at the agent/CP commit
  path, surfaced on the group view.
- Polar production org + products still need creating (sandbox wiring is
  done; `POLAR_SERVER=production` + product IDs per env).
