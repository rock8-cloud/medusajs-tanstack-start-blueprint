import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from '@tanstack/react-router'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, ErrorText, Field, Input, Select } from '#/components/ui'
import { useToast } from '#/components/toast'
import { addAddressFn, deleteAddressFn } from '#/lib/server/account'
import { getRegionFn } from '#/lib/server/regions'

export const Route = createFileRoute('/account/addresses')({
  loader: async () => ({ region: await getRegionFn() }),
  head: () => ({
    meta: [{ title: 'Adresy — Medusa Store' }],
  }),
  component: AddressesPage,
})

function AddressesPage() {
  const { region } = Route.useLoaderData()
  const { customer } = useLoaderData({ from: '/account' })
  const router = useRouter()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addresses = customer.addresses ?? []
  const countries = region.countries ?? []

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const get = (key: string) => form.get(key)?.toString().trim() ?? ''

    setBusy(true)
    setError(null)
    try {
      const result = await addAddressFn({
        data: {
          first_name: get('first_name'),
          last_name: get('last_name'),
          company: get('company') || undefined,
          address_1: get('address_1'),
          address_2: get('address_2') || undefined,
          city: get('city'),
          postal_code: get('postal_code'),
          country_code: get('country_code'),
          phone: get('phone') || undefined,
          is_default_shipping: form.get('is_default_shipping') === 'on',
        },
      })

      if (result.success) {
        toast.push('Adresa uložena')
        setShowForm(false)
        await router.invalidate()
      } else {
        setError(result.error)
      }
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async (addressId: string) => {
    setPendingDelete(addressId)
    try {
      const result = await deleteAddressFn({ data: { addressId } })
      if (result.success) {
        toast.push('Adresa odebrána')
      } else {
        toast.push(result.error ?? 'Adresu se nepodařilo odebrat', 'error')
      }
      await router.invalidate()
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold text-ink">Adresy</h2>
        <Button
          variant="secondary"
          onClick={() => setShowForm((s) => !s)}
          aria-expanded={showForm}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {showForm ? 'Zrušit' : 'Přidat adresu'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-xl border border-line bg-surface p-6"
        >
          <h3 className="font-semibold text-ink">Nová adresa</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Jméno" htmlFor="a_first_name" required>
              <Input id="a_first_name" name="first_name" required />
            </Field>
            <Field label="Příjmení" htmlFor="a_last_name" required>
              <Input id="a_last_name" name="last_name" required />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Firma (nepovinné)" htmlFor="a_company">
                <Input id="a_company" name="company" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Ulice a číslo popisné" htmlFor="a_address_1" required>
                <Input id="a_address_1" name="address_1" required />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Doplněk adresy (nepovinné)" htmlFor="a_address_2">
                <Input id="a_address_2" name="address_2" />
              </Field>
            </div>
            <Field label="Město" htmlFor="a_city" required>
              <Input id="a_city" name="city" required />
            </Field>
            <Field label="PSČ" htmlFor="a_postal_code" required>
              <Input id="a_postal_code" name="postal_code" required />
            </Field>
            <Field label="Země" htmlFor="a_country_code" required>
              <Select
                id="a_country_code"
                name="country_code"
                required
                defaultValue={countries[0]?.iso_2 ?? ''}
              >
                {countries.map((country) => (
                  <option key={country.iso_2} value={country.iso_2 ?? ''}>
                    {country.display_name ?? country.iso_2}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Telefon (nepovinné)" htmlFor="a_phone">
              <Input id="a_phone" name="phone" type="tel" />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="is_default_shipping"
              className="h-4 w-4 accent-brand-600"
            />
            Nastavit jako výchozí doručovací adresu
          </label>

          <div className="mt-5 space-y-3">
            <ErrorText>{error}</ErrorText>
            <Button type="submit" busy={busy}>
              Uložit adresu
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <MapPin className="h-9 w-9 text-ink-soft" aria-hidden />
          <p className="font-medium text-ink">Žádné uložené adresy</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Uložte si doručovací adresu a urychlete pokladnu.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col rounded-xl border border-line bg-surface p-5"
            >
              <p className="text-sm font-semibold text-ink">
                {address.first_name} {address.last_name}
                {address.is_default_shipping && (
                  <span className="ml-2 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    Výchozí
                  </span>
                )}
              </p>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
                {address.company && (
                  <>
                    {address.company}
                    <br />
                  </>
                )}
                {address.address_1}
                {address.address_2 && <>, {address.address_2}</>}
                <br />
                {address.postal_code} {address.city}
                <br />
                {address.country_code?.toUpperCase()}
              </p>
              <button
                type="button"
                onClick={() => onDelete(address.id)}
                disabled={pendingDelete === address.id}
                className="mt-3 flex min-h-10 w-fit items-center gap-1.5 rounded-lg px-2 text-sm text-ink-soft hover:text-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Odebrat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
