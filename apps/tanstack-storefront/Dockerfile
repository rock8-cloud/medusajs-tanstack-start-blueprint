# syntax=docker/dockerfile:1
# TanStack Start storefront (@dtc/tanstack-storefront). Build from the repository root:
#   docker build -f apps/tanstack-storefront/Dockerfile \
#     --build-arg VITE_MEDUSA_BACKEND_URL=https://api.example.com \
#     --build-arg VITE_MEDUSA_PUBLISHABLE_KEY=pk_... -t medusa-storefront .
#
# Vite inlines VITE_* at build time, so the backend URL + publishable key are
# build args (on Rock8Cloud: env vars with stage "build"). `vite build` emits
# dist/{client,server}; server.mjs is a tiny Node adapter that serves the client
# assets and the SSR fetch handler.

FROM node:24-bookworm-slim AS base
COPY --from=oven/bun:1.3.14 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# ---- build ----
FROM base AS build
# Every workspace manifest, so --frozen-lockfile resolves against bun.lock.
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/tanstack-storefront/package.json apps/tanstack-storefront/package.json
RUN bun install --frozen-lockfile
COPY apps/tanstack-storefront ./apps/tanstack-storefront
WORKDIR /app/apps/tanstack-storefront
ARG VITE_MEDUSA_BACKEND_URL
ARG VITE_MEDUSA_PUBLISHABLE_KEY
ARG VITE_DEFAULT_REGION=de
ENV VITE_MEDUSA_BACKEND_URL=$VITE_MEDUSA_BACKEND_URL \
    VITE_MEDUSA_PUBLISHABLE_KEY=$VITE_MEDUSA_PUBLISHABLE_KEY \
    VITE_DEFAULT_REGION=$VITE_DEFAULT_REGION
RUN bun run build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/tanstack-storefront
# The SSR bundle keeps react/@tanstack/etc as external imports, so ship the
# hoisted node_modules. package.json provides "type": "module" for the bundle.
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/tanstack-storefront/package.json ./package.json
COPY --from=build /app/apps/tanstack-storefront/dist ./dist
COPY --from=build /app/apps/tanstack-storefront/server.mjs ./server.mjs
ENV PORT=3000 HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "server.mjs"]
