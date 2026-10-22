import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "#/lib/sdk"
import { jsonSafe } from "#/lib/json-safe"

const DEFAULT_COUNTRY = import.meta.env.VITE_DEFAULT_REGION || "de"

let regionCache: { at: number; regions: HttpTypes.StoreRegion[] } | null = null

const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  if (regionCache && Date.now() - regionCache.at < 5 * 60 * 1000) {
    return regionCache.regions
  }

  const { regions } = await sdk.client.fetch<{
    regions: HttpTypes.StoreRegion[]
  }>(`/store/regions`, { method: "GET" })

  regionCache = { at: Date.now(), regions }
  return regions
}

// Resolves the region for the default store country, falling back to the
// first configured region so the storefront still works if the country list
// changes on the backend.
export const getRegion = async (): Promise<HttpTypes.StoreRegion> => {
  const regions = await listRegions()

  const region =
    regions.find((r) =>
      r.countries?.some((c) => c.iso_2 === DEFAULT_COUNTRY)
    ) ?? regions[0]

  if (!region) {
    throw new Error("No regions configured on the Medusa backend")
  }

  return region
}

export const getRegionFn = createServerFn({ method: "GET" }).handler(
  async () => jsonSafe(await getRegion())
)
