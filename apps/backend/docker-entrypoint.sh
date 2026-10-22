#!/bin/sh
# Release + start for the Medusa backend, from the compiled server output.
#
# The platform restarts the pod if it doesn't pass its health check within a
# short window, and each Medusa app bootstrap is slow on a constrained pod
# (worse with managed-DB latency). So keep the path to a listening /health as
# short as possible: skip the migrate bootstrap when the DB is already migrated,
# and create the admin user off the critical path.
set -e

cd /app/apps/backend/.medusa/server
export PATH="/app/node_modules/.bin:$PATH"

# Fast, dependency-light check (no full Medusa bootstrap): is the DB migrated?
# Set FORCE_MIGRATE=true to always run migrations (e.g. after adding new ones).
NEED_MIGRATE=$(node -e '
  const { Client } = require("pg");
  const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false;
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl });
  c.connect()
    .then(() => c.query("SELECT COUNT(*)::int AS n FROM mikro_orm_migrations"))
    .then((r) => process.stdout.write(r.rows[0].n > 0 ? "no" : "yes"))
    .catch(() => process.stdout.write("yes"))
    .finally(() => c.end().catch(() => {}));
' 2>/dev/null || echo yes)

if [ "$FORCE_MIGRATE" = "true" ] || [ "$NEED_MIGRATE" = "yes" ]; then
  echo "[entrypoint] Running migrations (schema + scripts)..."
  medusa db:migrate
  # Fresh DB: create the admin user here (blocking). Doing it only on the migrate
  # path — never concurrently with `medusa start` — avoids a second full app
  # bootstrap running alongside the server, which spikes memory and OOM-kills the
  # pod on a small instance. On restarts the DB is already migrated and the admin
  # user already exists, so this is skipped entirely.
  if [ -n "$MEDUSA_ADMIN_EMAIL" ] && [ -n "$MEDUSA_ADMIN_PASSWORD" ]; then
    echo "[entrypoint] Ensuring admin user $MEDUSA_ADMIN_EMAIL ..."
    medusa user -e "$MEDUSA_ADMIN_EMAIL" -p "$MEDUSA_ADMIN_PASSWORD" \
      || echo "[entrypoint] admin user already exists / skipped"
  fi
else
  echo "[entrypoint] DB already migrated — skipping migrate + admin-user for fast, low-memory startup."
fi

echo "[entrypoint] Starting Medusa production server on :${PORT:-9000} ..."
exec medusa start
