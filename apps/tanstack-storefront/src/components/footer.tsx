import { Link } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"

export function Footer({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) {
  const topLevel = categories.filter((c) => !c.parent_category_id).slice(0, 6)

  return (
    <footer className="mt-16 bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-xl font-extrabold uppercase tracking-tight">
            Medusa Store
          </p>
        </div>

        <nav aria-label="Obchod">
          <p className="text-sm font-semibold text-accent">Obchod</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                to="/products"
                className="text-sm text-brand-100 hover:text-white"
              >
                Všechny produkty
              </Link>
            </li>
            {topLevel.map((category) => (
              <li key={category.id}>
                <Link
                  to="/categories/$handle"
                  params={{ handle: category.handle }}
                  className="text-sm text-brand-100 hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Účet">
          <p className="text-sm font-semibold text-accent">Účet</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                to="/account"
                className="text-sm text-brand-100 hover:text-white"
              >
                Můj účet
              </Link>
            </li>
            <li>
              <Link
                to="/cart"
                className="text-sm text-brand-100 hover:text-white"
              >
                Košík
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-brand-800">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-brand-200 sm:px-6">
          © {new Date().getFullYear()} Medusa Store
        </p>
      </div>
    </footer>
  )
}
