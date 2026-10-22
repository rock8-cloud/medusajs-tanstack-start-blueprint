import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { CheckCircle2, Package } from 'lucide-react'
import {
  OrderStatusBadge,
  OrderStatusTracker,
} from '#/components/order-status'
import { PriceTotals } from '#/components/price-totals'
import { formatDate, formatPrice } from '#/lib/format'
import { getOrderState } from '#/lib/order-status'
import { getOrderFn } from '#/lib/server/account'

export const Route = createFileRoute('/order/$id')({
  loader: async ({ params }) => {
    const order = await getOrderFn({ data: { id: params.id } })

    if (!order) {
      throw notFound()
    }

    return { order }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Objednávka č. ${loaderData.order.display_id} — Medusa Store`
          : 'Objednávka — Medusa Store',
      },
    ],
  }),
  component: OrderConfirmation,
})

function OrderConfirmation() {
  const { order } = Route.useLoaderData()
  const currency = order.currency_code ?? 'eur'
  const address = order.shipping_address
  const state = getOrderState(order)
  const createdAt = formatDate(order.created_at as string)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {state === 'placed' ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2
            className="mx-auto h-12 w-12 text-green-600"
            aria-hidden
          />
          <h1 className="mt-3 font-display text-3xl font-bold text-ink">
            Děkujeme za objednávku!
          </h1>
          <p className="mt-2 text-ink-soft">
            Objednávka{' '}
            <span className="font-mono font-semibold text-ink">
              č. {order.display_id}
            </span>{' '}
            byla vytvořena dne {createdAt}.
          </p>
        </div>
      ) : (
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Objednávka{' '}
            <span className="font-mono">č. {order.display_id}</span>
          </h1>
          <p className="mt-1 text-ink-soft">Vytvořena dne {createdAt}</p>
        </div>
      )}

      <section className="mt-8 rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Stav objednávky</h2>
          <OrderStatusBadge state={state} />
        </div>
        <div className="mt-5">
          <OrderStatusTracker state={state} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Položky</h2>
        <ul className="mt-4 divide-y divide-line">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-canvas">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-line" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {item.product_title ?? item.title}
                </p>
                {item.variant_title && item.variant_title !== 'Default variant' && (
                  <p className="text-xs text-ink-soft">{item.variant_title}</p>
                )}
              </div>
              <span className="text-sm text-ink-soft">×{item.quantity}</span>
              <span className="text-sm font-semibold text-ink">
                {formatPrice(item.subtotal ?? 0, currency)}
              </span>
            </li>
          ))}
        </ul>

        <PriceTotals totals={order} currency={currency} className="mt-4" />
      </section>

      {address && (
        <section className="mt-6 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold text-ink">Doručovací adresa</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            {address.first_name} {address.last_name}
            {address.company && (
              <>
                <br />
                {address.company}
              </>
            )}
            <br />
            {address.address_1}
            {address.address_2 && <>, {address.address_2}</>}
            <br />
            {address.postal_code} {address.city}
            <br />
            {address.country_code?.toUpperCase()}
          </p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/products"
          search={{}}
          className="inline-flex min-h-11 items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-strong"
        >
          Pokračovat v nákupu
        </Link>
        <Link
          to="/account/orders"
          className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-ink hover:border-brand-400"
        >
          Moje objednávky
        </Link>
      </div>
    </div>
  )
}
