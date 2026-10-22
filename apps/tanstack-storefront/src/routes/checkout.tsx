import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import type { HttpTypes } from '@medusajs/types'
import { Check, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, ErrorText, Field, Input, Select } from '#/components/ui'
import { PriceTotals } from '#/components/price-totals'
import { formatPrice } from '#/lib/format'
import {
  getCartFn,
  initiatePaymentSessionFn,
  listPaymentProvidersFn,
  listShippingOptionsFn,
  placeOrderFn,
  setCheckoutAddressFn,
  setShippingMethodFn,
} from '#/lib/server/cart'
import { getCustomerFn } from '#/lib/server/auth'

type CheckoutStep = 'address' | 'delivery' | 'review'

const PROVIDER_LABELS: Record<string, string> = {
  pp_system_default: 'Ruční platba',
}

const providerLabel = (id: string) =>
  PROVIDER_LABELS[id] ??
  id.replace(/^pp_/, '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>): { step?: CheckoutStep } => ({
    step:
      search.step === 'delivery' || search.step === 'review'
        ? search.step
        : undefined,
  }),
  loader: async () => {
    const cart = await getCartFn()

    if (!cart || !cart.items?.length) {
      throw redirect({ to: '/cart' })
    }

    const [customer, shippingOptions, paymentProviders] = await Promise.all([
      getCustomerFn(),
      listShippingOptionsFn(),
      listPaymentProvidersFn(),
    ])

    return { cart, customer, shippingOptions, paymentProviders }
  },
  head: () => ({
    meta: [{ title: 'Pokladna — Medusa Store' }],
  }),
  component: CheckoutPage,
})

function StepHeader({
  current,
}: {
  current: CheckoutStep
}) {
  const steps: { key: CheckoutStep; label: string }[] = [
    { key: 'address', label: 'Adresa' },
    { key: 'delivery', label: 'Doprava a platba' },
    { key: 'review', label: 'Souhrn' },
  ]
  const currentIndex = steps.findIndex((s) => s.key === current)

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-center gap-2">
          {index > 0 && <span className="text-line">—</span>}
          <span
            aria-current={step.key === current ? 'step' : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium ${
              step.key === current
                ? 'bg-brand-900 text-white'
                : index < currentIndex
                  ? 'text-brand-700'
                  : 'text-ink-soft'
            }`}
          >
            {index < currentIndex && <Check className="h-3.5 w-3.5" aria-hidden />}
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}

function CheckoutPage() {
  const { cart, customer, shippingOptions, paymentProviders } =
    Route.useLoaderData()
  const { step = 'address' } = Route.useSearch()

  const currency = cart.currency_code ?? 'eur'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">Pokladna</h1>
        <p className="flex items-center gap-1.5 text-sm text-ink-soft">
          <Lock className="h-4 w-4" aria-hidden /> Bezpečná pokladna
        </p>
      </div>

      <div className="mt-6">
        <StepHeader current={step} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          {step === 'address' && (
            <AddressStep cart={cart} customer={customer} />
          )}
          {step === 'delivery' && (
            <DeliveryStep
              cart={cart}
              shippingOptions={shippingOptions}
              paymentProviders={paymentProviders}
              currency={currency}
            />
          )}
          {step === 'review' && <ReviewStep cart={cart} currency={currency} />}
        </div>

        <CheckoutSummary cart={cart} currency={currency} />
      </div>
    </div>
  )
}

function AddressStep({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
}) {
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const countries = cart.region?.countries ?? []
  const existing = cart.shipping_address

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const get = (key: string) => form.get(key)?.toString().trim() ?? ''

    const shippingAddress = {
      first_name: get('first_name'),
      last_name: get('last_name'),
      company: get('company') || undefined,
      address_1: get('address_1'),
      address_2: get('address_2') || undefined,
      city: get('city'),
      postal_code: get('postal_code'),
      country_code: get('country_code'),
      phone: get('phone') || undefined,
    }

    setBusy(true)
    setError(null)
    try {
      const result = await setCheckoutAddressFn({
        data: {
          email: get('email'),
          shipping_address: shippingAddress,
        },
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      await router.invalidate()
      navigate({ search: { step: 'delivery' } })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">Doručovací adresa</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="E-mail" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={cart.email ?? customer?.email ?? ''}
            />
          </Field>
        </div>

        <Field label="Jméno" htmlFor="first_name" required>
          <Input
            id="first_name"
            name="first_name"
            required
            autoComplete="given-name"
            defaultValue={existing?.first_name ?? customer?.first_name ?? ''}
          />
        </Field>
        <Field label="Příjmení" htmlFor="last_name" required>
          <Input
            id="last_name"
            name="last_name"
            required
            autoComplete="family-name"
            defaultValue={existing?.last_name ?? customer?.last_name ?? ''}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Firma (nepovinné)" htmlFor="company">
            <Input
              id="company"
              name="company"
              autoComplete="organization"
              defaultValue={existing?.company ?? ''}
            />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Ulice a číslo popisné" htmlFor="address_1" required>
            <Input
              id="address_1"
              name="address_1"
              required
              autoComplete="address-line1"
              defaultValue={existing?.address_1 ?? ''}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Doplněk adresy (nepovinné)" htmlFor="address_2">
            <Input
              id="address_2"
              name="address_2"
              autoComplete="address-line2"
              defaultValue={existing?.address_2 ?? ''}
            />
          </Field>
        </div>

        <Field label="Město" htmlFor="city" required>
          <Input
            id="city"
            name="city"
            required
            autoComplete="address-level2"
            defaultValue={existing?.city ?? ''}
          />
        </Field>
        <Field label="PSČ" htmlFor="postal_code" required>
          <Input
            id="postal_code"
            name="postal_code"
            required
            autoComplete="postal-code"
            defaultValue={existing?.postal_code ?? ''}
          />
        </Field>

        <Field label="Země" htmlFor="country_code" required>
          <Select
            id="country_code"
            name="country_code"
            required
            defaultValue={
              existing?.country_code ?? countries[0]?.iso_2 ?? ''
            }
          >
            {countries.map((country) => (
              <option key={country.iso_2} value={country.iso_2 ?? ''}>
                {country.display_name ?? country.iso_2}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Telefon (nepovinné)" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={existing?.phone ?? customer?.phone ?? ''}
          />
        </Field>
      </div>

      <div className="mt-6 space-y-3">
        <ErrorText>{error}</ErrorText>
        <Button type="submit" busy={busy} className="w-full sm:w-auto sm:px-10">
          Pokračovat k dopravě
        </Button>
      </div>
    </form>
  )
}

function DeliveryStep({
  cart,
  shippingOptions,
  paymentProviders,
  currency,
}: {
  cart: HttpTypes.StoreCart
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  paymentProviders: HttpTypes.StorePaymentProvider[]
  currency: string
}) {
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingId, setShippingId] = useState<string | null>(
    cart.shipping_methods?.[0]?.shipping_option_id ?? null
  )
  const [providerId, setProviderId] = useState<string | null>(
    paymentProviders[0]?.id ?? null
  )

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!shippingId) {
      setError('Vyberte prosím způsob dopravy.')
      return
    }
    if (!providerId) {
      setError('Vyberte prosím způsob platby.')
      return
    }

    setBusy(true)
    setError(null)
    try {
      const shippingResult = await setShippingMethodFn({
        data: { optionId: shippingId },
      })
      if (!shippingResult.success) {
        setError(shippingResult.error)
        return
      }

      const paymentResult = await initiatePaymentSessionFn({
        data: { providerId },
      })
      if (!paymentResult.success) {
        setError(paymentResult.error)
        return
      }

      await router.invalidate()
      navigate({ search: { step: 'review' } })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="rounded-xl border border-line bg-surface p-6">
        <legend className="sr-only">Způsob dopravy</legend>
        <h2 className="text-lg font-semibold text-ink">Způsob dopravy</h2>

        {shippingOptions.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Pro vaši adresu nejsou dostupné žádné způsoby dopravy. Vraťte se
            prosím zpět a zkontrolujte adresu.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {shippingOptions.map((option) => (
              <label
                key={option.id}
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  shippingId === option.id
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-line bg-surface hover:border-brand-300'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping_option"
                    value={option.id}
                    checked={shippingId === option.id}
                    onChange={() => setShippingId(option.id)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  <span className="font-medium text-ink">{option.name}</span>
                </span>
                <span className="font-semibold text-ink">
                  {option.amount != null
                    ? option.amount === 0
                      ? 'Zdarma'
                      : formatPrice(option.amount, currency)
                    : '—'}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-surface p-6">
        <legend className="sr-only">Způsob platby</legend>
        <h2 className="text-lg font-semibold text-ink">Způsob platby</h2>

        {paymentProviders.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Momentálně nejsou dostupné žádné způsoby platby. Zkuste to prosím
            později.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {paymentProviders.map((provider) => (
              <label
                key={provider.id}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  providerId === provider.id
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-line bg-surface hover:border-brand-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_provider"
                  value={provider.id}
                  checked={providerId === provider.id}
                  onChange={() => setProviderId(provider.id)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="font-medium text-ink">
                  {providerLabel(provider.id)}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="space-y-3">
        <ErrorText>{error}</ErrorText>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ search: {} })}
          >
            Zpět
          </Button>
          <Button type="submit" busy={busy} className="flex-1 sm:flex-none sm:px-10">
            Pokračovat k souhrnu
          </Button>
        </div>
      </div>
    </form>
  )
}

function ReviewStep({
  cart,
  currency,
}: {
  cart: HttpTypes.StoreCart
  currency: string
}) {
  const navigate = useNavigate({ from: Route.fullPath })
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const address = cart.shipping_address
  const shippingMethod = cart.shipping_methods?.[0]

  const onPlaceOrder = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await placeOrderFn()

      if (result.success && result.orderId) {
        await router.invalidate()
        navigate({
          to: '/order/$id',
          params: { id: result.orderId },
        })
      } else {
        setError(result.error ?? 'Objednávku se nepodařilo dokončit.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Doručení na</h2>
          <button
            type="button"
            onClick={() => navigate({ search: {} })}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Upravit
          </button>
        </div>
        {address ? (
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
            {cart.email && (
              <>
                <br />
                <span className="text-ink-soft">{cart.email}</span>
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Adresa zatím není vyplněná.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Doprava a platba</h2>
          <button
            type="button"
            onClick={() => navigate({ search: { step: 'delivery' } })}
            className="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Upravit
          </button>
        </div>
        <p className="mt-3 text-sm text-ink">
          {shippingMethod?.name ?? 'Způsob dopravy vybrán'}
          {shippingMethod?.amount != null && (
            <span className="text-ink-soft">
              {' '}
              · {formatPrice(shippingMethod.amount, currency)}
            </span>
          )}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Položky</h2>
        <ul className="mt-3 divide-y divide-line">
          {(cart.items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate text-ink">
                {item.quantity}× {item.product_title ?? item.title}
              </span>
              <span className="whitespace-nowrap font-medium text-ink">
                {formatPrice(item.subtotal ?? 0, currency)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-soft">Ceny položek jsou bez DPH.</p>
      </section>

      <div className="space-y-3">
        <ErrorText>{error}</ErrorText>
        <Button
          onClick={onPlaceOrder}
          busy={busy}
          className="min-h-13 w-full text-base"
        >
          Dokončit objednávku · {formatPrice(cart.total ?? 0, currency)} s DPH
        </Button>
      </div>
    </div>
  )
}

function CheckoutSummary({
  cart,
  currency,
}: {
  cart: HttpTypes.StoreCart
  currency: string
}) {
  return (
    <aside className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-20">
      <h2 className="text-lg font-semibold text-ink">Souhrn objednávky</h2>
      <ul className="mt-4 space-y-3">
        {(cart.items ?? []).map((item) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-canvas">
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <span className="min-w-0 flex-1 truncate text-ink">
              {item.product_title ?? item.title}
            </span>
            <span className="text-ink-soft">×{item.quantity}</span>
            <span className="font-medium text-ink">
              {formatPrice(item.subtotal ?? 0, currency)}
            </span>
          </li>
        ))}
      </ul>

      <PriceTotals totals={cart} currency={currency} className="mt-5" />

      <p className="mt-4 text-xs text-ink-soft">
        Potřebujete upravit položky?{' '}
        <Link to="/cart" className="text-brand-700 underline">
          Zpět do košíku
        </Link>
      </p>
    </aside>
  )
}
