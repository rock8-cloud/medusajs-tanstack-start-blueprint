import type { HttpTypes } from "@medusajs/types"

export type ProductPrice = {
  calculated_amount: number
  original_amount: number | null
  currency_code: string
  hasMultiplePrices: boolean
}

// Medusa returns prices in display format — never divide by 100.
export const getProductPrice = (
  product: HttpTypes.StoreProduct
): ProductPrice | null => {
  const priced = (product.variants ?? []).filter(
    (v) => v.calculated_price?.calculated_amount != null
  )

  if (!priced.length) {
    return null
  }

  const cheapest = priced.reduce((min, v) =>
    v.calculated_price!.calculated_amount! <
    min.calculated_price!.calculated_amount!
      ? v
      : min
  )

  const price = cheapest.calculated_price!
  const amounts = new Set(
    priced.map((v) => v.calculated_price!.calculated_amount)
  )

  return {
    calculated_amount: price.calculated_amount!,
    original_amount:
      price.original_amount != null &&
      price.original_amount !== price.calculated_amount
        ? price.original_amount
        : null,
    currency_code: price.currency_code ?? "eur",
    hasMultiplePrices: amounts.size > 1,
  }
}

export const getVariantPrice = (
  variant: HttpTypes.StoreProductVariant | undefined
): ProductPrice | null => {
  if (!variant?.calculated_price?.calculated_amount == null) {
    return null
  }
  const price = variant?.calculated_price
  if (!price || price.calculated_amount == null) {
    return null
  }

  return {
    calculated_amount: price.calculated_amount,
    original_amount:
      price.original_amount != null &&
      price.original_amount !== price.calculated_amount
        ? price.original_amount
        : null,
    currency_code: price.currency_code ?? "eur",
    hasMultiplePrices: false,
  }
}
