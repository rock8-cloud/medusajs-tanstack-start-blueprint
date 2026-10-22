import type { HttpTypes } from "@medusajs/types"
import { PackageSearch } from "lucide-react"
import { ProductCard } from "./product-card"

export function ProductGrid({
  products,
  eagerCount = 0,
}: {
  products: HttpTypes.StoreProduct[]
  eagerCount?: number
}) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
        <PackageSearch className="h-10 w-10 text-ink-soft" aria-hidden />
        <p className="font-medium text-ink">Žádné produkty nenalezeny</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Zkuste jiný výraz, nebo si projděte všechny produkty.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            eager={index < eagerCount}
          />
        </li>
      ))}
    </ul>
  )
}
