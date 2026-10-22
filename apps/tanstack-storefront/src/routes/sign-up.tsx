import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, ErrorText, Field, Input } from '#/components/ui'
import { signupFn } from '#/lib/server/auth'

export const Route = createFileRoute('/sign-up')({
  head: () => ({
    meta: [{ title: 'Vytvořit účet — Medusa Store' }],
  }),
  component: SignUpPage,
})

function SignUpPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const get = (key: string) => form.get(key)?.toString().trim() ?? ''

    setBusy(true)
    setError(null)
    try {
      const result = await signupFn({
        data: {
          email: get('email'),
          password: form.get('password')?.toString() ?? '',
          first_name: get('first_name'),
          last_name: get('last_name'),
          phone: get('phone') || undefined,
        },
      })

      if (result.state === 'success') {
        await router.invalidate()
        navigate({ to: '/account' })
      } else if (result.state === 'verification_required') {
        setVerificationEmail(result.email)
      } else {
        setError(result.error)
      }
    } finally {
      setBusy(false)
    }
  }

  if (verificationEmail) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-brand-600" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            Už jen krok — zkontrolujte e-mail
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Poslali jsme ověřovací odkaz na{' '}
            <span className="font-medium text-ink">{verificationEmail}</span>.
            Otevřete ho pro ověření e-mailu a poté se{' '}
            <Link to="/sign-in" search={{}} className="text-brand-700 underline">
              přihlaste
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-line bg-surface p-8">
        <h1 className="font-display text-2xl font-bold text-ink">
          Vytvořit účet
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ukládejte si adresy a sledujte objednávky.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jméno" htmlFor="first_name" required>
              <Input
                id="first_name"
                name="first_name"
                required
                autoComplete="given-name"
              />
            </Field>
            <Field label="Příjmení" htmlFor="last_name" required>
              <Input
                id="last_name"
                name="last_name"
                required
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field label="E-mail" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </Field>
          <Field label="Telefon (nepovinné)" htmlFor="phone">
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>
          <Field label="Heslo" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>

          <ErrorText>{error}</ErrorText>

          <Button type="submit" busy={busy} className="w-full">
            Vytvořit účet
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Už máte účet?{' '}
          <Link
            to="/sign-in"
            search={{}}
            className="font-medium text-brand-700 hover:text-brand-800"
          >
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  )
}
