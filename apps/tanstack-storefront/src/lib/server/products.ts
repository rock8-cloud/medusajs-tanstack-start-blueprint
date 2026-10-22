import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "#/lib/sdk"
import { jsonSafe } from "#/lib/json-safe"
import { getAuthHeaders } from "./cookies"
import { getRegion } from "./regions"

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags"

export type ProductSort = "created_at" | "price_asc" | "price_desc" | "title"

export const listProductsFn = createServerFn({ method: "GET" })
  .validator(
    (input: {
      page?: number
      limit?: number
      /** One category or a whole subtree; products in any of them match. */
      categoryId?: string | string[]
      collectionId?: string
      q?: string
      order?: ProductSort
    }) => input
  )
  .handler(async ({ data }) => {
    const region = await getRegion()
    const limit = data.limit ?? 12
    const page = Math.max(data.page ?? 1, 1)
    const offset = (page - 1) * limit

    const order =
      data.order === "title"
        ? "title"
        : data.order === "price_asc"
          ? "variants.prices.amount"
          : data.order === "price_desc"
            ? "-variants.prices.amount"
            : "-created_at"

    const { products, count } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>(`/store/products`, {
      method: "GET",
      query: {
        limit,
        offset,
        order,
        region_id: region.id,
        fields: PRODUCT_FIELDS,
        ...(data.categoryId ? { category_id: data.categoryId } : {}),
        ...(data.collectionId ? { collection_id: data.collectionId } : {}),
        ...(data.q ? { q: data.q } : {}),
      },
      headers: { ...getAuthHeaders() },
    })

    return jsonSafe({
      products,
      count,
      page,
      totalPages: Math.max(Math.ceil(count / limit), 1),
      region,
    })
  })

export const getProductFn = createServerFn({ method: "GET" })
  .validator((input: { handle: string }) => input)
  .handler(async ({ data }) => {
    const region = await getRegion()

    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>(`/store/products`, {
      method: "GET",
      query: {
        handle: data.handle,
        region_id: region.id,
        fields: PRODUCT_FIELDS + ",*categories",
      },
      headers: { ...getAuthHeaders() },
    })

    return jsonSafe({
      product: products[0] ?? null,
      region,
    })
  })
