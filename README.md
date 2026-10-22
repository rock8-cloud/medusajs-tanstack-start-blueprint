# Medusa + TanStack Start Commerce Blueprint

A complete headless commerce starter: a [Medusa 2](https://medusajs.com)
backend with its admin dashboard, a [TanStack Start](https://tanstack.com/start)
storefront, PostgreSQL and Redis — built to deploy on
[Rock8Cloud](https://rock8.cloud) from two checked-in Dockerfiles.

[![Deploy on Rock8Cloud](https://img.shields.io/badge/Deploy%20on-Rock8Cloud-06b6d4?style=for-the-badge)](https://app.rock8.cloud/login?redirect=%2Fnew-deployment%3Fblueprint%3Dmedusa-tanstack%26utm_source%3Dgithub%26utm_medium%3Dreadme%26utm_campaign%3Dblueprint)

The storefront covers the whole buying path out of the box: catalog, categories,
search, product variants, cart with promo codes, a three-step checkout, order
confirmation, and customer accounts (sign-up, email verification, orders,
addresses, profile). Its UI is in Czech — change the copy to suit your shop.

| Layer      | Tech                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| Monorepo   | [Turborepo](https://turborepo.dev) + [Bun](https://bun.sh) workspaces                                 |
| Commerce   | [Medusa 2](https://docs.medusajs.com) — API, admin dashboard, workflows, modules                      |
| Storefront | [TanStack Start](https://tanstack.com/start) + [Medusa JS SDK](https://docs.medusajs.com/resources/js-sdk) + [Tailwind v4](https://tailwindcss.com) on React 19 |
| Database   | PostgreSQL 17                                                                                         |
| Redis      | Cache, event bus, workflow engine and locking for Medusa                                              |
| Deploy     | [Rock8Cloud](https://rock8.cloud) — two Dockerfile services + managed Postgres + managed Redis         |

## Architecture

```
  Browser
     │  pages + server-function calls (same origin)
     ▼
  ┌───────────────────────────────────────────────────────────────┐
  │ apps/tanstack-storefront — TanStack Start (SSR)               │
  │   src/lib/server/*  server functions → Medusa JS SDK          │
  │   customer JWT + cart id in httpOnly cookies                  │
  └───────────────────────────────────────────────────────────────┘
     │  Store API (publishable key)
     ▼
  ┌───────────────────────────────────────────────────────────────┐
  │ apps/backend — Medusa 2 (:9000)   admin dashboard at /app     │
  └───────────────────────────────────────────────────────────────┘
     │                                   │
     ▼                                   ▼
  PostgreSQL                          Redis
  (all commerce data)                 (events, workflows, locks, cache)
```

## Layout

```
apps/
  backend/                   Medusa 2 server + admin
    medusa-config.ts         database, Redis modules, CORS, admin
    src/
      api/ modules/ workflows/ subscribers/ jobs/ links/ admin/
                             Medusa's extension points (empty, with READMEs)
      migration-scripts/
        initial-data-seed.ts store, region, demo products, publishable key
    Dockerfile               how Rock8Cloud builds this service
    docker-entrypoint.sh     migrate on first boot, create admin, start
  tanstack-storefront/       TanStack Start storefront
    src/
      routes/                pages: home, products, categories, cart,
                             checkout, order, account, sign-in, sign-up
      lib/server/            server functions — every Medusa call lives here
      lib/sdk.ts             the one Medusa SDK client
    server.mjs               production Node server for the built app
    Dockerfile
docker-compose.yml           local Postgres (host port 5433) + Redis (6380)
.mcp.json                    Rock8Cloud MCP endpoint, for agent-driven deploys
AGENTS.md                    rules for coding agents (CLAUDE.md points here)
```

## Quickstart

Prerequisites: [Bun](https://bun.sh) ≥ 1.3.14, Node ≥ 20 and Docker.

```sh
docker compose up -d                                  # Postgres + Redis
bun install
cp apps/backend/.env.template apps/backend/.env
cp apps/tanstack-storefront/.env.example apps/tanstack-storefront/.env

cd apps/backend
bunx medusa db:migrate                                # schema + demo data
bunx medusa user -e admin@example.com -p supersecret  # admin login
cd ../..

bun run dev    # backend http://localhost:9000/app, storefront http://localhost:3333
```

No API key to copy: the seed creates the publishable key with a pinned value
that the storefront already uses (see [Publishable API key](#publishable-api-key)).

## Commands

| Command             | What it does                                                       |
| ------------------- | ------------------------------------------------------------------ |
| `bun run dev`       | Both dev servers: backend `:9000`, storefront `:3333`              |
| `bun run build`     | Production builds of both apps                                     |
| `bun run typecheck` | `tsc --noEmit` in both apps                                        |
| `bun run test`      | Storefront unit tests                                              |
| `bun run lint`      | `medusa lint` in the backend                                       |

## Deploy on [Rock8Cloud](https://rock8.cloud)

[![Deploy on Rock8Cloud](https://img.shields.io/badge/Deploy%20on-Rock8Cloud-06b6d4?style=for-the-badge)](https://app.rock8.cloud/login?redirect=%2Fnew-deployment%3Fblueprint%3Dmedusa-tanstack%26utm_source%3Dgithub%26utm_medium%3Dreadme%26utm_campaign%3Dblueprint)

Click the button to sign in, clone this blueprint to your GitHub account, and
deploy it through the Rock8Cloud UI.

### Connect MCP and prompt your agent

This repository ships [`.mcp.json`](.mcp.json) with the Rock8Cloud MCP endpoint
already configured, so an MCP-capable coding agent can do the whole deployment.
Open the repo in your agent (Claude Code, for example), complete the OAuth login
when prompted, and ask:

```text
Deploy this project to Rock8Cloud.
```

No API key, deployment CLI or GitHub Actions workflow is required.

### Or deploy by hand

These are the steps the agent follows — do them in the Rock8Cloud UI if you
prefer:

1. **Push this repository to GitHub** and make sure Rock8Cloud can see it.
2. **Create a project** to group the four services.
3. **Provision PostgreSQL** (version `17`) and **Redis** in that project.
4. **Create the backend service** from the repo: Dockerfile
   `apps/backend/Dockerfile`, container port `9000`, health endpoint `/health`.
   Give it **at least 1 GiB of memory** — Medusa idles near 460 MiB, and the
   default allocation gets it killed.
5. **Link the databases into the backend**: the Postgres connection string as
   `DATABASE_URL` and the Redis connection string as `REDIS_URL`. The values
   resolve at deploy time — nothing is copied by hand.
6. **Set the backend variables**:
   - `DATABASE_SSL=true` — managed Postgres only accepts TLS connections.
   - `JWT_SECRET`, `COOKIE_SECRET` — long random values; enter them in the
     dashboard yourself.
   - `MEDUSA_ADMIN_EMAIL`, `MEDUSA_ADMIN_PASSWORD` — the admin user created on
     the first boot.
   - `ADMIN_CORS` = the backend URL; `STORE_CORS` = the storefront URL;
     `AUTH_CORS` = both, comma-separated.
7. **Deploy the backend.** The first boot runs the migrations, seeds the store
   (Europe region, demo products, the pinned publishable API key) and creates
   the admin user — sign in at `<backend URL>/app`.
8. **Create the storefront service** from the same repo: Dockerfile
   `apps/tanstack-storefront/Dockerfile`, container port `3000`.
9. **Set the storefront build variable** (stage *build* — Vite inlines it):
   `VITE_MEDUSA_BACKEND_URL` = the backend URL. Optionally
   `VITE_DEFAULT_REGION` (default `de`).
10. **Deploy the storefront** and open its URL.

Every push to `main` redeploys automatically. `PORT` is injected by the
platform — do not set it manually; both servers bind whatever they are given.

Migrations run only while the database is empty, to keep restarts fast. After
you add a migration or upgrade Medusa, deploy the backend once with
`FORCE_MIGRATE=true`.

### Publishable API key

Medusa's Store API only answers requests that carry a publishable API key.
Normally the key is random, so it has to be copied from the admin into the
storefront after the first deploy. This blueprint pins it instead: the seed
(`apps/backend/src/migration-scripts/initial-data-seed.ts`) creates the key with
a fixed value, and the storefront (`apps/tanstack-storefront/src/lib/sdk.ts`)
falls back to the same value, so both work on the first deploy.

That is safe to publish: a publishable key is not a secret — every Medusa
storefront sends it from the browser — and it only selects which sales channel's
products are visible. To use your own key, set `MEDUSA_PUBLISHABLE_KEY` on the
backend **before its first deploy** and `VITE_MEDUSA_PUBLISHABLE_KEY` (build
stage) on the storefront to the same `pk_…` value. The seed runs once, so later
changes go through **Settings → Publishable API Keys** in the admin.

Verify the images locally before deploying (both build from the repository
root):

```sh
docker build -f apps/backend/Dockerfile -t medusa-backend .
docker build -f apps/tanstack-storefront/Dockerfile \
  --build-arg VITE_MEDUSA_BACKEND_URL=http://localhost:9000 -t medusa-storefront .
```

> The `EXPOSE`d ports (backend 9000, storefront 3000) must match the ports
> configured on the Rock8Cloud services, or health checks will fail.

## Extending the blueprint

- **Add an API route** — a `route.ts` under `apps/backend/src/api/`, e.g.
  `src/api/store/hello/route.ts` serves `GET /store/hello`.
- **Add a data model** — a module in `apps/backend/src/modules/`, registered in
  `medusa-config.ts`, then `bunx medusa db:generate <module>` and
  `bunx medusa db:migrate`.
- **React to events** — a subscriber in `src/subscribers/` (e.g. on
  `order.placed`); it runs through the Redis event bus.
- **Extend the admin** — widgets and pages in `apps/backend/src/admin/`.
- **Add a storefront page** — a file in `apps/tanstack-storefront/src/routes/`,
  with its Medusa calls as a server function in `src/lib/server/`.

See the [Medusa docs](https://docs.medusajs.com) and the
[TanStack Start docs](https://tanstack.com/start/latest).

## License

[MIT](LICENSE)
