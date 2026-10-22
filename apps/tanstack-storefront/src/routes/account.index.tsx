import {
  Link,
  createFileRoute,
  useLoaderData,
} from '@tanstack/react-router'
import { ArrowRight, MapPin, Package } from 'lucide-react'
import { listOrdersFn } from '#/lib/server/account'

export const Route = createFileRoute('/account/')({
  loader: async () => {
    const orders = await listOrdersFn({ data: { limit: 3 } })
    return { orders }
  },
  component: AccountOverview,
})

function AccountOverview() {
  const { orders } = Route.useLoaderData()
  const { customer } = useLoaderData({ from: '/account' })

  const cards = [
    {
      to: '/account/orders',
      icon: Package,
      title: 'Objednávky',
      value: `${orders.length}${orders.length === 3 ? '+' : ''} posledních`,
      hint: 'Sledujte a procházejte své objednávky.',
    },
    {
      to: '/account/addresses',
      icon: MapPin,
      title: 'Adresy',
      value: `${customer.addresses?.length ?? 0} uložených`,
      hint: 'Doručovací adresy pro rychlejší pokladnu.',
    },
  ] as const

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink">
        Dobrý den{customer.first_name ? `, ${customer.first_name}` : ''}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Tady je přehled vašeho účtu.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.to}>
            <Link
              to={card.to}
              className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-400"
            >
              <card.icon className="h-6 w-6 text-brand-600" aria-hidden />
              <p className="mt-3 font-semibold text-ink">{card.title}</p>
              <p className="text-sm text-brand-700">{card.value}</p>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-soft">
                {card.hint}
              </p>
              <span className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-700">
                Otevřít <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
