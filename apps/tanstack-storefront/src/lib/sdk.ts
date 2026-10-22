import Medusa from "@medusajs/js-sdk"

export const MEDUSA_BACKEND_URL =
  import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"

// The key the backend seeds on its first boot (initial-data-seed.ts), so a fresh
// deploy works with no configuration. Publishable keys are public by design.
const DEFAULT_PUBLISHABLE_KEY =
  "pk_ba6cfdbae4e8086c63c51d771f3f678a2fead0510415d71cf959214518d00759"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: import.meta.env.DEV,
  publishableKey:
    import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY,
})
