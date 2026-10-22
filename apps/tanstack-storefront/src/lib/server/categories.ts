import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "#/lib/sdk"
import { jsonSafe } from "#/lib/json-safe"

export const listCategoriesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { product_categories } = await sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>("/store/product-categories", {
      method: "GET",
      query: {
        fields: "*category_children,*parent_category",
        limit: 100,
      },
    })

    return jsonSafe(product_categories)
  }
)

export const getCategoryFn = createServerFn({ method: "GET" })
  .validator((input: { handle: string }) => input)
  .handler(async ({ data }) => {
    const { product_categories } = await sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>(`/store/product-categories`, {
      method: "GET",
      query: {
        fields: "*category_children,*parent_category",
        handle: data.handle,
        // Nested children, so the page can list products of the whole subtree.
        include_descendants_tree: true,
      },
    })

    return jsonSafe(product_categories[0] ?? null)
  })

/**
 * The category and all its descendants. Products usually sit in the leaf
 * categories only, so a parent's page has to ask for the whole subtree.
 */
export function categoryTreeIds(category: {
  id: string
  category_children?: unknown[] | null
}): string[] {
  const children = (category.category_children ?? []) as {
    id: string
    category_children?: unknown[] | null
  }[]
  return [category.id, ...children.flatMap(categoryTreeIds)]
}
