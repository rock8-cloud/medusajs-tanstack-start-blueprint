import { Link, createFileRoute, useLoaderData } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ProductGrid } from '#/components/product-grid'
import { listProductsFn } from '#/lib/server/products'

export const Route = createFileRoute('/')({
  loader: async () => {
    const { products } = await listProductsFn({ data: { limit: 8 } })
    return { products }
  },
  component: Home,
})

function Home() {
  const { products } = Route.useLoaderData()
  const { categories } = useLoaderData({ from: '__root__' })

  const topLevel = categories.filter((c) => !c.parent_category_id).slice(0, 6)

  return (
    <div>
      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Medusa Store
          </h1>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-semibold text-brand-900 hover:bg-accent-strong"
          >
            Všechny produkty <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Categories */}
      {topLevel.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold text-ink">
              Procházet podle kategorie
            </h2>
            <Link
              to="/products"
              className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Všechny produkty <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {topLevel.map((category) => (
              <li key={category.id}>
                <Link
                  to="/categories/$handle"
                  params={{ handle: category.handle }}
                  className="flex min-h-24 flex-col justify-between rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-400"
                >
                  <span className="font-medium text-ink">{category.name}</span>
                  <span className="mt-2 flex items-center gap-1 text-sm text-brand-700">
                    Nakupovat <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Latest products */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">
            Nejnovější produkty
          </h2>
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Zobrazit vše <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid
            products={products}
            eagerCount={4}
          />
        </div>
      </section>
    </div>
  )
}
