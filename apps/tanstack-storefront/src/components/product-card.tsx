import { Link } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { Package } from "lucide-react"
import { formatPrice } from "#/lib/format"
import { getProductPrice } from "#/lib/price"

export function ProductCard({
  product,
  eager = false,
}: {
  product: HttpTypes.StoreProduct
  eager?: boolean
}) {
  const price = getProductPrice(product)

  return (
    <Link
      to="/products/$handle"
      params={{ handle: product.handle }}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="aspect-square w-full overflow-hidden bg-canvas">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            loading={eager ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-line" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-medium leading-snug text-ink group-hover:text-brand-700">
          {product.title}
        </h3>
        {product.collection?.title && (
          <p className="text-xs text-ink-soft">{product.collection.title}</p>
        )}
        <p className="mt-auto pt-2 text-sm font-semibold text-ink">
          {price ? (
            <>
              {price.hasMultiplePrices && (
                <span className="font-normal text-ink-soft">od </span>
              )}
              {formatPrice(price.calculated_amount, price.currency_code)}
              {price.original_amount != null && (
                <span className="ml-2 font-normal text-ink-soft line-through">
                  {formatPrice(price.original_amount, price.currency_code)}
                </span>
              )}
              <span className="ml-1 text-xs font-normal text-ink-soft">
                bez DPH
              </span>
            </>
          ) : (
            <span className="font-normal text-ink-soft">Cena na vyžádání</span>
          )}
        </p>
      </div>
    </Link>
  )
}
