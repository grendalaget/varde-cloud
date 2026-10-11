# infra/cp — hosted control plane on Fly.io

Runs the Varde control plane (`apps/controlplane` from the public repo) at
`cp.varde.games` on Fly Machines: scales **out** under request load (the proxy
wakes suspended machines as concurrency rises) and **down** when idle (surplus
machines suspend). One machine stays warm for agent heartbeats and linking.

## Prerequisites

- `flyctl` authenticated (`fly auth login`)
- A Postgres database — the CP has a `postgres://` dialect with embedded
  migrations. Either a Fly Postgres cluster (`fly postgres create`) or any
  managed Postgres (Neon, Supabase, Cloud SQL). `VARDE_DB` is a secret.

## Deploy

```bash
cd infra/cp

fly apps create varde-cp                # once

fly secrets set \
  VARDE_DB='postgres://USER:PASS@HOST/varde_cp?sslmode=require' \
  VARDE_PUBLIC_URL='https://cp.varde.games' \
  VARDE_SIGNUP='invite'

fly deploy --build-arg VARDE_REF=main   # or a tag, e.g. v1.2.3

fly scale count 3                       # provision burst capacity (stays suspended when idle)

fly certs add cp.varde.games            # then point the DNS record at the app
```

## Scaling model

- `min_machines_running = 1` — one warm machine always (heartbeat interval is
  5 s; a stopped CP means unlinked groups, so do not set this to 0).
- `soft_limit = 200` concurrent requests/machine — when exceeded, the proxy
  starts suspended machines (up to `fly scale count`).
- `auto_stop_machines = "suspend"` — machines above the minimum suspend when
  traffic drains; they resume in ~1 s, not a cold boot.
- To go further (unbounded autoscale-out), run the community
  `fly-autoscaler` app against the app's metrics; the machine count above is
  the manual ceiling it would move between.

## Secrets and env

| Var | Where | Notes |
| --- | --- | --- |
| `VARDE_DB` | `fly secrets` | `postgres://…` — required for multi-machine (sqlite is single-writer) |
| `VARDE_PUBLIC_URL` | `fly secrets` | `https://cp.varde.games` — device-link verification base |
| `VARDE_SIGNUP` | `fly secrets` | `invite` recommended for the hosted CP |
| `VARDE_EMBEDDED_RELAY` / `VARDE_EMBEDDED_RELAY_ADDR` | optional | in-process QUIC relay; needs a dedicated IPv4 + UDP service block — not wired in this fly.toml (declared `--relay`s / fallback relays cover it for v1) |

## Known limits before scaling past 1 sustained machine

- **Reconciler + scheduler run per-machine** — in-process tickers; at N>1
  they double-fire. Their idempotency under concurrent runs is unverified, so
  sustained multi-instance needs leader election (a Postgres advisory lock)
  or a `--role=worker` split first. The current profile mostly runs 1 warm
  machine with suspended burst extras, which keeps exposure small but real
  under sustained load.
- `store.Open` sets `MaxOpenConns(1)` — a sqlite-era safety that serializes
  every query; raise it for Postgres before real traffic.
- The embedded relay (UDP :3478) needs a dedicated IPv4 address and a
  `[[services]]` UDP block; left out until relays are actually needed.
