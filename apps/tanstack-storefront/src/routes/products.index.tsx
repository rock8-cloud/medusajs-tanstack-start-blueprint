import {
  Link,
  createFileRoute,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router'
import { Pagination } from '#/components/pagination'
import { ProductGrid } from '#/components/product-grid'
import { SortSelect } from '#/components/sort-select'
import { czPlural } from '#/lib/format'
import { listProductsFn, type ProductSort } from '#/lib/server/products'

type ProductSearch = {
  page?: number
  q?: string
  sort?: ProductSort
}

export const Route = createFileRoute('/products/')({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    page: search.page ? Number(search.page) : undefined,
    q: typeof search.q === 'string' && search.q ? search.q : undefined,
    sort:
      search.sort === 'price_asc' ||
      search.sort === 'price_desc' ||
      search.sort === 'title'
        ? search.sort
        : undefined,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    q: search.q,
    sort: search.sort,
  }),
  loader: async ({ deps }) =>
    listProductsFn({
      data: { page: deps.page, q: deps.q, order: deps.sort, limit: 12 },
    }),
  head: () => ({
    meta: [{ title: 'Všechny produkty — Medusa Store' }],
  }),
  component: ProductListing,
})

function ProductListing() {
  const { products, count, page, totalPages } =
    Route.useLoaderData()
  const { q, sort } = Route.useSearch()
  const { categories } = useLoaderData({ from: '__root__' })
  const navigate = useNavigate({ from: Route.fullPath })

  const topLevel = categories.filter((c) => !c.parent_category_id)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            {q ? `Výsledky pro „${q}“` : 'Všechny produkty'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
            {count} {czPlural(count, ['produkt', 'produkty', 'produktů'])}
          </p>
        </div>
        <SortSelect
          value={sort}
          onChange={(newSort) =>
            navigate({
              search: (prev) => ({ ...prev, sort: newSort, page: undefined }),
            })
          }
        />
      </header>

      {topLevel.length > 0 && (
        <nav aria-label="Kategorie" className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center rounded-full border border-brand-900 bg-brand-900 px-4 text-sm font-medium text-white">
            Vše
          </span>
          {topLevel.map((category) => (
            <Link
              key={category.id}
              to="/categories/$handle"
              params={{ handle: category.handle }}
              className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-brand-400"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-8">
        <ProductGrid
          products={products}
          eagerCount={4}
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        makeSearch={(p) => ({
          q,
          sort,
          page: p === 1 ? undefined : p,
        })}
      />
    </div>
  )
}
