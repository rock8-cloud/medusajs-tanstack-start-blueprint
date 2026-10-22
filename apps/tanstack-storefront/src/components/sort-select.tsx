import type { ProductSort } from "#/lib/server/products"
import { Select } from "./ui"

export function SortSelect({
  value,
  onChange,
}: {
  value: ProductSort | undefined
  onChange: (sort: ProductSort | undefined) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-ink-soft">
        Řadit
      </label>
      <Select
        id="sort"
        value={value ?? "created_at"}
        onChange={(e) =>
          onChange(
            e.target.value === "created_at"
              ? undefined
              : (e.target.value as ProductSort)
          )
        }
        className="w-auto"
      >
        <option value="created_at">Nejnovější</option>
        <option value="price_asc">Cena: od nejnižší</option>
        <option value="price_desc">Cena: od nejvyšší</option>
        <option value="title">Název A–Z</option>
      </Select>
    </div>
  )
}
