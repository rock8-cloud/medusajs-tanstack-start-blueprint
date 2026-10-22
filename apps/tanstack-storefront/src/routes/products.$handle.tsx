import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import type { HttpTypes } from '@medusajs/types'
import { CheckCircle2, ChevronRight, Minus, Plus, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button } from '#/components/ui'
import { useToast } from '#/components/toast'
import { formatPrice } from '#/lib/format'
import { addToCartFn } from '#/lib/server/cart'
import { getProductFn } from '#/lib/server/products'

export const Route = createFileRoute('/products/$handle')({
  loader: async ({ params }) => {
    const { product, region } = await getProductFn({
      data: { handle: params.handle },
    })

    if (!product) {
      throw notFound()
    }

    return { product, region }
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { product } = loaderData
    const price = product.variants?.[0]?.calculated_price
    const description = product.description

    return {
      meta: [
        { title: `${product.title} — Medusa Store` },
        ...(description
          ? [{ name: 'description', content: description.slice(0, 160) }]
          : []),
        { property: 'og:title', content: product.title },
        ...(product.thumbnail
          ? [{ property: 'og:image', content: product.thumbnail }]
          : []),
      ],
      scripts: [
        {
          type: 'application/ld+json',
          // Rendered as raw HTML: escape "<" so a title or description with
          // "</script>" can't end the tag. Still the same JSON.
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: description ?? undefined,
            image: product.thumbnail ?? undefined,
            sku: product.variants?.[0]?.sku ?? undefined,
            offers:
              price?.calculated_amount != null
                ? {
                    '@type': 'Offer',
                    price: price.calculated_amount,
                    priceCurrency: price.currency_code?.toUpperCase(),
                    availability: 'https://schema.org/InStock',
                  }
                : undefined,
          }).replace(/</g, '\\u003c'),
        },
      ],
    }
  },
  component: ProductDetail,
})

const optionsMatch = (
  variant: HttpTypes.StoreProductVariant,
  selected: Record<string, string>
) =>
  (variant.options ?? []).every(
    (value) => selected[value.option_id ?? ''] === value.value
  )

function ProductDetail() {
  const { product } = Route.useLoaderData()
  const router = useRouter()
  const toast = useToast()

  const variants = product.variants ?? []
  const options = product.options ?? []
  const hasChoices = variants.length > 1

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    if (variants.length === 1) {
      const only: Record<string, string> = {}
      variants[0].options?.forEach((value) => {
        if (value.option_id) only[value.option_id] = value.value
      })
      return only
    }
    return {}
  })
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)

  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ id: 'thumb', url: product.thumbnail }]
      : []
  const [activeImage, setActiveImage] = useState(0)

  const selectedVariant = useMemo(() => {
    if (variants.length === 1) return variants[0]
    if (Object.keys(selected).length < options.length) return undefined
    return variants.find((variant) => optionsMatch(variant, selected))
  }, [variants, options.length, selected])

  const price = selectedVariant?.calculated_price ?? null
  const cheapest = variants
    .filter((v) => v.calculated_price?.calculated_amount != null)
    .sort(
      (a, b) =>
        a.calculated_price!.calculated_amount! -
        b.calculated_price!.calculated_amount!
    )[0]?.calculated_price

  const outOfStock = Boolean(
    selectedVariant &&
      selectedVariant.manage_inventory &&
      !selectedVariant.allow_backorder &&
      (selectedVariant.inventory_quantity ?? 0) <= 0
  )

  const addToCart = async () => {
    if (!selectedVariant) return
    setBusy(true)
    try {
      const result = await addToCartFn({
        data: { variantId: selectedVariant.id, quantity },
      })
      if (result.success) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2500)
        toast.push(`Přidáno do košíku: ${product.title}`)
        await router.invalidate()
      } else {
        toast.push(result.error ?? 'Do košíku se nepodařilo přidat', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const category = product.categories?.[0]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Drobečková navigace" className="mb-6">
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
          {category && (
            <>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                <Link
                  to="/categories/$handle"
                  params={{ handle: category.handle }}
                  search={{}}
                  className="hover:text-brand-700"
                >
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-ink">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-line bg-surface">
            {images[activeImage] ? (
              <img
                src={images[activeImage].url}
                alt={product.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-16 w-16 text-line" aria-hidden />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <ul className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Zobrazit obrázek ${index + 1}`}
                    aria-current={index === activeImage}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                      index === activeImage
                        ? 'border-brand-600'
                        : 'border-line hover:border-brand-300'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Info + purchase */}
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink">
            {product.title}
          </h1>

          {selectedVariant?.sku && (
            <p className="mt-1 font-mono text-sm text-ink-soft">
              Kód: {selectedVariant.sku}
            </p>
          )}

          <p className="mt-4 text-2xl font-semibold text-ink">
            {price?.calculated_amount != null ? (
              <>
                {formatPrice(price.calculated_amount, price.currency_code ?? 'eur')}
                <span className="ml-1.5 text-sm font-normal text-ink-soft">
                  bez DPH
                </span>
              </>
            ) : cheapest?.calculated_amount != null ? (
              <>
                <span className="text-base font-normal text-ink-soft">
                  od{' '}
                </span>
                {formatPrice(
                  cheapest.calculated_amount,
                  cheapest.currency_code ?? 'eur'
                )}
                <span className="ml-1.5 text-sm font-normal text-ink-soft">
                  bez DPH
                </span>
              </>
            ) : (
              <span className="text-base font-normal text-ink-soft">
                Cena na vyžádání
              </span>
            )}
          </p>

          {/* Options */}
          {hasChoices &&
            options.map((option) => (
              <fieldset key={option.id} className="mt-6">
                <legend className="text-sm font-medium text-ink">
                  {option.title}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {option.values?.map((value) => {
                    const isSelected = selected[option.id] === value.value
                    return (
                      <button
                        key={value.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          setSelected((prev) => ({
                            ...prev,
                            [option.id]: value.value,
                          }))
                        }
                        className={`min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-line bg-surface text-ink hover:border-brand-400'
                        }`}
                      >
                        {value.value}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}

          {/* Stock */}
          <div className="mt-6">
            {selectedVariant ? (
              outOfStock ? (
                <Badge tone="amber">Vyprodáno</Badge>
              ) : (
                <Badge tone="green">Skladem</Badge>
              )
            ) : hasChoices ? (
              <Badge tone="neutral">Vyberte variantu pro zobrazení dostupnosti</Badge>
            ) : null}
          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-line bg-surface">
              <button
                type="button"
                aria-label="Snížit množství"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-ink hover:text-brand-700 disabled:text-line"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span
                className="min-w-10 text-center text-sm font-semibold"
                aria-label={`Množství: ${quantity}`}
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Zvýšit množství"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-11 w-11 items-center justify-center text-ink hover:text-brand-700"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <Button
              onClick={addToCart}
              busy={busy}
              disabled={!selectedVariant || outOfStock}
              className="flex-1 sm:flex-none sm:px-10"
            >
              {added ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Přidáno
                </>
              ) : !selectedVariant && hasChoices ? (
                'Vyberte variantu'
              ) : outOfStock ? (
                'Vyprodáno'
              ) : (
                'Přidat do košíku'
              )}
            </Button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Popis
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink wrap-anywhere">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
