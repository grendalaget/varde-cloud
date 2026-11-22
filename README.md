<p align="center">
  <img src="public/brand/varde-logo-dark.svg" alt="Varde" width="280" />
</p>

<p align="center"><b>varde.games</b> — website and cloud services for <a href="https://github.com/grendalaget/varde">Varde</a></p>

This public repository holds the marketing site, user accounts, live Polar
billing integration and managed cloud anchor provisioning. Varde's core technology lives in the
public repo and stays open source (AGPL-3.0-or-later) forever.

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS v4 — Vercel-ready
- **HeroUI** (`@heroui/react` v3 + `@heroui-pro/react`) components, themed to the Varde palette — the Pro package downloads its artifacts via a `postinstall` that needs `HEROUI_AUTH_TOKEN` (CI/CD license key, see `.env.example`)
- **better-auth** — email+password today, OAuth-ready (`socialProviders`)
- **Drizzle ORM** + Turso (libSQL) — chosen over Prisma because it's a thin
  schema-in-TypeScript layer with zero codegen step in the app itself
  (drizzle-kit only runs for schema changes), a first-class better-auth
  adapter, and Turso's generous free tier. Local dev runs on a plain
  `file:./varde.db` SQLite — no server needed.
- **Polar** for payments, as merchant of record (they handle global VAT,
  invoicing, refunds, disputes), wired via the official
  `@polar-sh/better-auth` plugin. Billing is live on varde.games and remains
  optional in local deployments through the `POLAR_*` environment variables.
- **pnpm** — committed `pnpm-lock.yaml`; Vercel auto-detects it

## Layout

```
src/
  app/            routes: /, /pricing, /download, /auth/*, /account, /api/auth/*
  components/     nav, footer, brand marks, auth form
  db/             Drizzle schema (better-auth tables)
  lib/            auth server config, auth client, db pool
public/brand/     logo kit copied from grendalaget/varde (trademark policy applies)
services/         anchor-reconciler: provisions managed anchors on Fly.io
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

On HTTPS, all Better Auth cookies use the `__Host-varde.` prefix, `Secure`,
`HttpOnly`, `Path=/`, and no `Domain` attribute. Local HTTP development uses
host-only `varde.` cookies without `Secure`. Better Auth 1.7.7's automatic
`__Secure-` naming is disabled so it cannot hide the browser-enforced `__Host-`
prefix; the secure attribute is set explicitly. Cross-subdomain cookies stay
disabled, including for previews.

The CP deploy lives in `grendalaget/varde` at `infra/cp`.

The CP does not read site cookies. `/federate/cp` reads the site session on its
own host, then redirects to the CP with a five-minute federation token in the
URL fragment. The CP exchanges that token for its own session. `/api/cp/*`
uses a server-side exchange, and desktop sign-in also mints a federation token.
Docs are same-origin routes under `/docs`, not a separate docs authentication
host. No sibling subdomain needs the site's session cookie.

Deploying this cookie-name change signs existing site users out once. Old
domain-wide `better-auth` cookies are deliberately not accepted or migrated:
a fallback would restore the sibling-subdomain attack surface. Existing CP
sessions are independent. Old cookies can remain until their normal expiry,
but the site ignores their old names. Before enabling untrusted hosted apps,
revoke existing Better Auth sessions once (`DELETE FROM session` in the site's
database). Renaming cookies alone does not revoke their signed values: a stolen
legacy value could be replayed under the new name. This is an operator rollout
step, not something to repeat on every deployment. Users must sign in again on
the canonical site host.
Serve production auth over HTTPS and keep the exact-origin allowlist; hosted
apps under `*.play.varde.games` are same-site but must never be trusted origins.

All mutating API exports use `withSameOrigin` from `src/lib/csrf.ts` before
session lookup or side effects. Better Auth and the guard share the base URL
resolver and exact trusted-origin list in `src/lib/auth-origins.ts`: production
defaults to `https://varde.games`, previews to their deployment URL, and explicit
`BETTER_AUTH_URL` wins. The list includes the base origin, `varde.games`,
`www.varde.games`, localhost development, and the exact configured Vercel
deployment and branch origins. It never trusts wildcard subdomains.
Without Origin, only `Sec-Fetch-Site: same-origin` or `none` is accepted.
Untrusted sibling origins,
`null`, missing metadata and arbitrary bearer headers do not bypass this guard.
Only `POST /api/auth/polar/webhooks` is exempt: Polar authenticates its raw body
by signature before billing updates. The desktop token route reads a browser
session, so it is guarded, not a machine-endpoint exemption.

The test suite enumerates API route exports with the TypeScript parser and
rejects unwrapped mutating handlers, including re-exports and destructuring.
There are no server actions; the coverage test rejects new `use server`
directives until they receive an explicit CSRF review.

## Billing (Polar)

Polar is the merchant of record — we don't touch card data or VAT. The
`@polar-sh/better-auth` plugin creates a Polar customer lazily at the first
billing action (external_id = user.id), serves `/api/auth/checkout` + `/customer/portal`,
and verifies webhooks at `POST /api/auth/polar/webhooks`. Subscription
events write `plan` (`free` | `anchor` | `anchor+`) onto the user row — see
`syncPlan` in `src/lib/auth.ts` and the product→plan map in `src/lib/polar.ts`.

Billing is live on varde.games. Without `POLAR_ACCESS_TOKEN`, a deployment
renders "Coming soon" and makes no Polar calls. To configure another deployment,
create the three products in Polar (Anchor €3.99/month or €39.90/year,
Anchor+ €6/month), set `POLAR_ACCESS_TOKEN`,
`POLAR_SERVER`, the product-ID envs, and add a webhook endpoint pointing at
`/api/auth/polar/webhooks` (set `POLAR_WEBHOOK_SECRET`).

## Deploy (Vercel)

1. Import `grendalaget/varde-cloud` in Vercel — Next.js is auto-detected,
   zero config needed.
2. Set env vars: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (from the Turso
   CLI), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://varde.games`.
3. Push the schema once: `TURSO_DATABASE_URL=<prod> TURSO_AUTH_TOKEN=<tok> pnpm db:push`
   (or run the generated SQL from `pnpm db:generate`).
4. Done. Future OAuth provider keys go in the same env var set.

Schema changes use `pnpm db:push`, not committed SQL migrations. Before
deploying this version, push the schema to add the nullable `user.attribution`
column to existing databases. Back up the database and review the schema diff
before approving a production push. Existing users need no attribution value.

## Analytics and attribution

Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to enable cookieless Plausible analytics.
Leave it unset to disable the script and all analytics events. An optional
`NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC` selects a self-hosted script; server events
go to `/api/event` on that script's origin. Public variables are build-time
configuration, so rebuild after changing them.

Create Plausible goals for `download_click` (properties: `os`, `target`),
`sign_up_started`, `sign_up_completed`, `email_verified` and `checkout_started`
(property: `plan`). Sign-up starts and checkout starts are client-side intent
events. Download links and buttons are tracked client-side, independent of
redirect caching. Artifact links report their selected OS and target; links to
the download page report the browser OS and `target: download-page`. Raw redirect
requests and visitors without JavaScript do not emit download events. Account
creation and successful verification are tracked server-side.
Analytics failures do not prevent the underlying action. No account identifiers
or email addresses are sent as event properties.

The first landing with `ref` or `utm_*` parameters sets the host-only,
HttpOnly `varde_attribution` cookie for 30 days. Later campaigns do not replace
it during that period. Values are bounded and copied as JSON to the nullable
user attribution field on account creation, independently of analytics being
enabled. Absent or malformed cookies produce no attribution. Campaign values
are untrusted input, not proof of a referral or eligibility for an offer.

Product Hunt referrals (`ref=producthunt` or `utm_source=producthunt`) show a
dismissible welcome banner. A readable 30-day `varde_producthunt` flag keeps it
available across pages without exposing attribution data. Dismissal is stored
in localStorage. `NEXT_PUBLIC_PH_OFFER` optionally adds plain-text offer copy;
it does not create a checkout discount or establish eligibility.

Set `NEXT_PUBLIC_DISCORD_URL` to show a community link in navigation, footer
and docs. It is hidden when unset. Support email is `support@varde.games`.

### Provisioning checklist

- Vercel project + `varde.games` DNS
- Turso database + auth token (`turso db create varde`, `turso db tokens create`)
- `BETTER_AUTH_SECRET` in Vercel env
- Polar production org + access token, products (Anchor monthly/yearly, Anchor+),
  webhook → `/api/auth/polar/webhooks`, `POLAR_*` envs in Vercel
- OAuth app credentials (GitHub/Google) when enabling social sign-in

## Brand

The site is dark-only: Natt `#10161A` canvas, Tåke `#DCE2E6` text, Skifer
surfaces. Glød `#FF5B1F` is reserved for the host/ember accent (lit stone,
primary CTA); warnings use `#E3C04B`. Text is set in Inter (`next/font`,
see `src/app/layout.tsx`). Logo files in `public/brand/` are copied unmodified from
`grendalaget/varde` (`brand/`), subject to its trademark policy. Geometry is
never altered.

## License

This repository is public and licensed under [AGPL-3.0-or-later](LICENSE).
The Varde name and logos are subject to the upstream
[trademark policy](https://github.com/grendalaget/varde/blob/main/TRADEMARKS.md),
not the AGPL grant. Forks must use their own name and logos.
