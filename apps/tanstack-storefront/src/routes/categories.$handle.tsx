import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { Pagination } from '#/components/pagination'
import { ProductGrid } from '#/components/product-grid'
import { SortSelect } from '#/components/sort-select'
import { czPlural } from '#/lib/format'
import { categoryTreeIds, getCategoryFn } from '#/lib/server/categories'
import { listProductsFn, type ProductSort } from '#/lib/server/products'

type CategorySearch = {
  page?: number
  sort?: ProductSort
}

export const Route = createFileRoute('/categories/$handle')({
  validateSearch: (search: Record<string, unknown>): CategorySearch => ({
    page: search.page ? Number(search.page) : undefined,
    sort:
      search.sort === 'price_asc' ||
      search.sort === 'price_desc' ||
      search.sort === 'title'
        ? search.sort
        : undefined,
  }),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1, sort: search.sort }),
  loader: async ({ params, deps }) => {
    const category = await getCategoryFn({ data: { handle: params.handle } })

    if (!category) {
      throw notFound()
    }

    const result = await listProductsFn({
      data: {
        page: deps.page,
        order: deps.sort,
        categoryId: categoryTreeIds(category),
        limit: 12,
      },
    })

    return { category, ...result }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.name ?? 'Kategorie'} — Medusa Store` },
      ...(loaderData?.category.description
        ? [{ name: 'description', content: loaderData.category.description }]
        : []),
    ],
  }),
  component: CategoryPage,
})

function CategoryPage() {
  const { category, products, count, page, totalPages } =
    Route.useLoaderData()
  const { sort } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Drobečková navigace" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
          <li>
            <Link to="/" className="hover:text-brand-700">
              Domů
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link to="/products" search={{}} className="hover:text-brand-700">
              Všechny produkty
            </Link>
          </li>
          {category.parent_category && (
            <>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link
                  to="/categories/$handle"
                  params={{ handle: category.parent_category.handle }}
                  search={{}}
                  className="hover:text-brand-700"
                >
                  {category.parent_category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-ink">
            {category.name}
          </li>
        </ol>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              {category.description}
            </p>
          )}
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

      {category.category_children &&
        category.category_children.length > 0 && (
          <nav aria-label="Podkategorie" className="mt-6 flex flex-wrap gap-2">
            {category.category_children.map((child) => (
              <Link
                key={child.id}
                to="/categories/$handle"
                params={{ handle: child.handle }}
                search={{}}
                className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-brand-400"
              >
                {child.name}
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
        makeSearch={(p) => ({ sort, page: p === 1 ? undefined : p })}
      />
    </div>
  )
}
