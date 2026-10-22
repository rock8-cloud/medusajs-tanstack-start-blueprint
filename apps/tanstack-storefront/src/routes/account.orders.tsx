import { Link, createFileRoute } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { OrderStatusBadge } from '#/components/order-status'
import { czPlural, formatPrice } from '#/lib/format'
import { getOrderState } from '#/lib/order-status'
import { listOrdersFn } from '#/lib/server/account'

export const Route = createFileRoute('/account/orders')({
  loader: async () => listOrdersFn({ data: { limit: 25 } }),
  head: () => ({
    meta: [{ title: 'Objednávky — Medusa Store' }],
  }),
  component: OrdersPage,
})

function OrdersPage() {
  const orders = Route.useLoaderData()

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink">Objednávky</h2>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <Package className="h-9 w-9 text-ink-soft" aria-hidden />
          <p className="font-medium text-ink">Zatím žádné objednávky</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Jakmile něco objednáte, zobrazí se tady.
          </p>
          <Link
            to="/products"
            search={{}}
            className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-strong"
          >
            Procházet produkty
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                to="/order/$id"
                params={{ id: order.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-400"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-ink">
                    č. {order.display_id}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {new Date(order.created_at as string).toLocaleDateString(
                      'cs-CZ',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    )}
                    {' · '}
                    {order.items?.length ?? 0}{' '}
                    {czPlural(order.items?.length ?? 0, [
                      'položka',
                      'položky',
                      'položek',
                    ])}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge state={getOrderState(order)} />
                  <p className="text-sm font-semibold text-ink">
                    {formatPrice(
                      order.total ?? 0,
                      order.currency_code ?? 'eur'
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
