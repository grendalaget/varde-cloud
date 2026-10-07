<p align="center">
  <img src="public/brand/varde-logo-dark.svg" alt="Varde" width="280" />
</p>

<p align="center"><b>varde.games</b> — website and cloud services for <a href="https://github.com/grendalaget/varde">Varde</a></p>

This repository holds everything hosted: the marketing site, user accounts,
and (later) cloud anchors and billing. Varde's core technology lives in the
public repo and stays open source (AGPL-3.0-or-later) forever.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS v4 — Vercel-ready
- **HeroUI** (`@heroui/react` v3) components, themed to the Varde palette
- **better-auth** — email+password today, OAuth-ready (`socialProviders`)
- **Drizzle ORM** + Turso (libSQL) — chosen over Prisma because it's a thin
  schema-in-TypeScript layer with zero codegen step in the app itself
  (drizzle-kit only runs for schema changes), a first-class better-auth
  adapter, and Turso's generous free tier. Local dev runs on a plain
  `file:./varde.db` SQLite — no server needed.
- **pnpm** — committed `pnpm-lock.yaml`; Vercel auto-detects it

## Layout

```
src/
  app/            routes: /, /pricing, /download, /auth/*, /account, /api/auth/*
  components/     nav, footer, brand marks, auth form
  db/             Drizzle schema (better-auth tables)
  lib/            auth server config, auth client, db pool
public/brand/     logo kit copied from grendalaget/varde (MIT)
infra/            (future) anchor-fleet provisioning
services/         (future) plan-sync workers
```

## Local development

```sh
pnpm install
cp .env.example .env        # set BETTER_AUTH_SECRET (`openssl rand -base64 32`);
                            # leave TURSO_* unset for the local file db
pnpm db:push                # create the auth tables in file:./varde.db
pnpm dev
```

No docker needed for the database. To point at a real Turso db instead, set
`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in `.env`.

Then http://localhost:3000 — sign up at `/auth/sign-up`, then `/account`.

### Useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `pnpm dev`          | Next dev server (Turbopack)                         |
| `pnpm build`        | production build                                    |
| `pnpm lint`         | eslint                                              |
| `pnpm typecheck`    | `tsc --noEmit`                                      |
| `pnpm db:push`      | push the Drizzle schema to `TURSO_DATABASE_URL`/`file:./varde.db` |
| `pnpm db:generate`  | emit SQL migrations into `drizzle/`                 |
| `pnpm auth:schema`  | regenerate `src/db/schema.ts` from better-auth      |

## Auth design

better-auth owns sign-up/sign-in/sessions. Email+password is enabled now;
GitHub/Google OAuth plug in via `socialProviders` in `src/lib/auth.ts` — the
`account` table already stores provider tokens.

The in-game Varde account (control-plane, argon2id) is intentionally separate
for now: this site never talks to the control-plane auth. Unification is a
later step — the CP has an `auth.Provider` seam, so the likely path is the CP
becoming an OIDC provider to this site (or vice versa) rather than shared
credentials.

## Deploy (Vercel)

1. Import `grendalaget/varde-cloud` in Vercel — Next.js is auto-detected,
   zero config needed.
2. Set env vars: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (from the Turso
   CLI), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://varde.games`.
3. Push the schema once: `TURSO_DATABASE_URL=<prod> TURSO_AUTH_TOKEN=<tok> pnpm db:push`
   (or run the generated SQL from `pnpm db:generate`).
4. Done. Future OAuth provider keys go in the same env var set.

### Provisioning checklist

- Vercel project + `varde.games` DNS
- Turso database + auth token (`turso db create varde`, `turso db tokens create`)
- `BETTER_AUTH_SECRET` in Vercel env
- OAuth app credentials (GitHub/Google) when enabling social sign-in
- Stripe/Polar keys when billing starts

## Brand

The site is dark-only: Natt `#10161A` canvas, Tåke `#DCE2E6` text, Skifer
surfaces. Glød `#FF5B1F` is reserved for the host/ember accent (lit stone,
primary CTA); warnings use `#E3C04B`. Headings are self-hosted Schibsted
Grotesk. Logo files in `public/brand/` are copied unmodified from
`grendalaget/varde` (`brand/`, MIT-licensed) — geometry is never altered.

## License

Proprietary — hosting, billing and this site's code are not open source.
Brand assets under `public/brand/` remain MIT like the upstream kit.
