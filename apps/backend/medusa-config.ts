import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    // Explicit pool bounds. Without a max, tarn (knex's pool) is handed
    // `max: undefined`, which on Linux lets module bootstrap starve the pool so
    // the migration's top-level transaction hangs acquiring a connection
    // (`medusa db:migrate` never progresses past "Starting top level transaction").
    databaseDriverOptions: {
      pool: {
        min: Number(process.env.DB_POOL_MIN) || 2,
        max: Number(process.env.DB_POOL_MAX) || 20,
      },
      // Managed Postgres (rock8cloud) requires TLS — pg_hba.conf rejects
      // unencrypted connections. Enable SSL when DATABASE_SSL=true; leave it off
      // for local/Docker Postgres, which doesn't serve TLS. rejectUnauthorized
      // is false because the managed cert isn't in the container's trust store.
      ...(process.env.DATABASE_SSL === "true"
        ? {
            ssl: { rejectUnauthorized: false },
            connection: { ssl: { rejectUnauthorized: false } },
          }
        : {}),
    },
    // In production Medusa expects an explicit worker mode. "shared" (the
    // default) boots the background worker in-process — resuming workflow
    // executions and starting the job scheduler during boot, which stalls
    // before the HTTP server binds on a constrained pod. "server" serves HTTP
    // only. Controlled by MEDUSA_WORKER_MODE.
    workerMode:
      (process.env.MEDUSA_WORKER_MODE as "shared" | "server" | "worker") ||
      "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  // Server instances build + serve the admin dashboard; a worker instance would
  // set DISABLE_MEDUSA_ADMIN=true (admin is served by the server instance).
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { redisUrl: process.env.REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/locking-redis",
            id: "locking-redis",
            is_default: true,
            options: { redisUrl: process.env.REDIS_URL },
          },
        ],
      },
    },
  ],
})
