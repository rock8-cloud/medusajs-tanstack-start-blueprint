import {
  Link,
  createFileRoute,
  useRouter,
} from '@tanstack/react-router'
import { Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '#/components/ui'
import { PriceTotals } from '#/components/price-totals'
import { useToast } from '#/components/toast'
import { formatPrice } from '#/lib/format'
import {
  applyPromotionFn,
  deleteLineItemFn,
  getCartFn,
  updateLineItemFn,
} from '#/lib/server/cart'

export const Route = createFileRoute('/cart')({
  loader: async () => getCartFn(),
  head: () => ({
    meta: [{ title: 'Košík — Medusa Store' }],
  }),
  component: CartPage,
})

function CartPage() {
  const cart = Route.useLoaderData()
  const router = useRouter()
  const toast = useToast()
  const [pendingLine, setPendingLine] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoBusy, setPromoBusy] = useState(false)

  const items = cart?.items ?? []
  const currency = cart?.currency_code ?? 'eur'

  const changeQuantity = async (lineId: string, quantity: number) => {
    setPendingLine(lineId)
    try {
      const result =
        quantity <= 0
          ? await deleteLineItemFn({ data: { lineId } })
          : await updateLineItemFn({ data: { lineId, quantity } })
      if (!result.success) {
        toast.push(result.error ?? 'Košík se nepodařilo upravit', 'error')
      }
      await router.invalidate()
    } finally {
      setPendingLine(null)
    }
  }

  const removeLine = async (lineId: string) => {
    setPendingLine(lineId)
    try {
      const result = await deleteLineItemFn({ data: { lineId } })
      if (!result.success) {
        toast.push(result.error ?? 'Položku se nepodařilo odebrat', 'error')
      }
      await router.invalidate()
    } finally {
      setPendingLine(null)
    }
  }

  const applyPromo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const code = new FormData(form).get('code')?.toString().trim()
    if (!code) return
    setPromoBusy(true)
    setPromoError(null)
    try {
      const result = await applyPromotionFn({ data: { code } })
      if (!result.success) {
        setPromoError(result.error ?? 'Tento kód se nepodařilo použít.')
      } else {
        form.reset()
        toast.push('Slevový kód použit')
      }
      await router.invalidate()
    } finally {
      setPromoBusy(false)
    }
  }

  if (!cart || items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <ShoppingCart className="h-10 w-10 text-ink-soft" aria-hidden />
          <h1 className="font-display text-2xl font-bold text-ink">
            Váš košík je prázdný
          </h1>
          <p className="max-w-sm text-sm text-ink-soft">
            Projděte si katalog a přidejte do košíku, co se vám líbí.
          </p>
          <Link
            to="/products"
            search={{}}
            className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-strong"
          >
            Procházet produkty
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Košík</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Items */}
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((item) => {
            const busy = pendingLine === item.id
            return (
              <li key={item.id} className="flex gap-4 p-4">
                <Link
                  to="/products/$handle"
                  params={{ handle: item.product_handle ?? '' }}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas"
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.product_title ?? item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-line" aria-hidden />
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/products/$handle"
                        params={{ handle: item.product_handle ?? '' }}
                        className="font-medium text-ink hover:text-brand-700"
                      >
                        {item.product_title ?? item.title}
                      </Link>
                      {item.variant?.title &&
                        item.variant.title !== 'Default variant' && (
                          <p className="mt-0.5 text-xs text-ink-soft">
                            {item.variant.title}
                          </p>
                        )}
                    </div>
                    <p className="whitespace-nowrap text-right text-sm font-semibold text-ink">
                      {formatPrice(item.subtotal ?? 0, currency)}
                      <span className="block text-xs font-normal text-ink-soft">
                        bez DPH
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-lg border border-line">
                      <button
                        type="button"
                        aria-label="Snížit množství"
                        disabled={busy}
                        onClick={() => changeQuantity(item.id, item.quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center text-ink hover:text-brand-700 disabled:text-line"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Zvýšit množství"
                        disabled={busy}
                        onClick={() => changeQuantity(item.id, item.quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center text-ink hover:text-brand-700 disabled:text-line"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeLine(item.id)}
                      className="flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm text-ink-soft hover:text-red-700 disabled:text-line"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> Odebrat
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold text-ink">Souhrn</h2>

          <form onSubmit={applyPromo} className="mt-4">
            <label htmlFor="promo" className="text-sm font-medium text-ink">
              Slevový kód
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="promo"
                name="code"
                type="text"
                autoComplete="off"
                className="min-h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-sm uppercase focus:border-brand-500 focus:outline-2 focus:outline-offset-1 focus:outline-brand-200"
              />
              <Button type="submit" variant="secondary" busy={promoBusy}>
                Použít
              </Button>
            </div>
            {promoError && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {promoError}
              </p>
            )}
          </form>

          <PriceTotals
            totals={cart}
            currency={currency}
            shippingPending={!cart.shipping_methods?.length}
            className="mt-5"
          />

          <Link
            to="/checkout"
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg bg-accent px-6 text-sm font-bold text-brand-900 hover:bg-accent-strong"
          >
            Přejít k pokladně
          </Link>
        </aside>
      </div>
    </div>
  )
}
