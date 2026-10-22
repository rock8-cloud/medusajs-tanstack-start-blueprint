# syntax=docker/dockerfile:1
# Medusa backend (@dtc/backend). Build from the repository root:
#   docker build -f apps/backend/Dockerfile -t medusa-backend .
#
# Node runtime (Medusa is a Node CLI) + bun for installs pinned by bun.lock.
# Nothing here needs a secret: DATABASE_URL, REDIS_URL etc. are read at runtime.

FROM node:24-bookworm-slim AS base
COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# ---- build: install deps + `medusa build` -> apps/backend/.medusa/server ----
FROM base AS build
# Manifests first, so `bun install` is cached until a dependency changes. The
# lockfile covers every workspace, so every package.json has to be present for
# --frozen-lockfile to resolve.
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/tanstack-storefront/package.json apps/tanstack-storefront/package.json
RUN bun install --frozen-lockfile
# Backend source.
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN bun run build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/backend/.medusa/server
# Hoisted node_modules (Medusa runtime deps) + the compiled server + admin build.
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/backend/.medusa /app/apps/backend/.medusa
COPY --from=build /app/apps/backend/package.json /app/apps/backend/package.json
COPY apps/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENV PORT=9000
EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
