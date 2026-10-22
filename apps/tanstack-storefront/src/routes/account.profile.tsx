import {
  createFileRoute,
  useLoaderData,
  useRouter,
} from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Button, ErrorText, Field, Input } from '#/components/ui'
import { useToast } from '#/components/toast'
import { updateCustomerFn } from '#/lib/server/account'

export const Route = createFileRoute('/account/profile')({
  head: () => ({
    meta: [{ title: 'Profil — Medusa Store' }],
  }),
  component: ProfilePage,
})

function ProfilePage() {
  const { customer } = useLoaderData({ from: '/account' })
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const get = (key: string) => form.get(key)?.toString().trim() ?? ''

    setBusy(true)
    setError(null)
    try {
      const result = await updateCustomerFn({
        data: {
          first_name: get('first_name'),
          last_name: get('last_name'),
          phone: get('phone'),
        },
      })

      if (result.success) {
        toast.push('Profil uložen')
        await router.invalidate()
      } else {
        setError(result.error)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink">Profil</h2>

      <form
        onSubmit={onSubmit}
        className="mt-6 max-w-lg rounded-xl border border-line bg-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jméno" htmlFor="first_name" required>
            <Input
              id="first_name"
              name="first_name"
              required
              autoComplete="given-name"
              defaultValue={customer.first_name ?? ''}
            />
          </Field>
          <Field label="Příjmení" htmlFor="last_name" required>
            <Input
              id="last_name"
              name="last_name"
              required
              autoComplete="family-name"
              defaultValue={customer.last_name ?? ''}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                disabled
                defaultValue={customer.email ?? ''}
                aria-describedby="email-note"
              />
            </Field>
            <p id="email-note" className="mt-1.5 text-xs text-ink-soft">
              E-mail nelze změnit — slouží jako přihlašovací údaj.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Field label="Telefon" htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={customer.phone ?? ''}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <ErrorText>{error}</ErrorText>
          <Button type="submit" busy={busy}>
            Uložit změny
          </Button>
        </div>
      </form>
    </div>
  )
}
