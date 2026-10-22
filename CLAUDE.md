# CLAUDE.md

**All project guidance lives in [AGENTS.md](AGENTS.md). Read it before making
changes.** It is the single source of truth — keep it updated rather than
duplicating content here.

Quick orientation:

- Turborepo monorepo: `apps/backend` (Medusa 2, :9000, admin at `/app`) +
  `apps/tanstack-storefront` (TanStack Start, :3333). Bun is the package manager.
- `docker compose up -d` (Postgres :5433, Redis :6380) must be running first;
  then `bun run dev`. Copy `apps/backend/.env.template` to `.env` and
  `apps/tanstack-storefront/.env.example` to `.env` first.
- Verify with `bun run typecheck`, `bun run test` and `bun run build`, then load
  the storefront and the admin.
- The storefront calls Medusa only from server functions in
  `src/lib/server/*`; `VITE_*` values are build-time and end up in the browser.
- The publishable API key is pinned: the seed and `src/lib/sdk.ts` share one
  default value, so no key needs copying. Change both or neither.
- Deploys to [Rock8Cloud](https://rock8.cloud) from `apps/backend/Dockerfile` and
  `apps/tanstack-storefront/Dockerfile`; `.mcp.json` connects the Rock8Cloud MCP
  server for agent-driven deploys.
- `apps/tanstack-storefront/src/routeTree.gen.ts` is generated — never edit it.
