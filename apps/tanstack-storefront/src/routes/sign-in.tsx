import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, ErrorText, Field, Input } from '#/components/ui'
import { loginFn } from '#/lib/server/auth'

type SignInSearch = { redirect?: string }

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    redirect:
      typeof search.redirect === 'string' &&
      search.redirect.startsWith('/') &&
      !search.redirect.startsWith('//')
        ? search.redirect
        : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Přihlášení — Medusa Store' }],
  }),
  component: SignInPage,
})

function SignInPage() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = form.get('email')?.toString().trim() ?? ''
    const password = form.get('password')?.toString() ?? ''

    setBusy(true)
    setError(null)
    setVerificationEmail(null)
    try {
      const result = await loginFn({ data: { email, password } })

      if (result.state === 'success') {
        await router.invalidate()
        navigate({ to: redirect ?? '/account' })
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
            Zkontrolujte svou e-mailovou schránku
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Poslali jsme ověřovací odkaz na{' '}
            <span className="font-medium text-ink">{verificationEmail}</span>.
            Otevřete ho pro ověření e-mailu a poté se znovu přihlaste.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-line bg-surface p-8">
        <h1 className="font-display text-2xl font-bold text-ink">Přihlášení</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Přístup k objednávkám a adresám.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="E-mail" htmlFor="email" required>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
            />
          </Field>
          <Field label="Heslo" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>

          <ErrorText>{error}</ErrorText>

          <Button type="submit" busy={busy} className="w-full">
            Přihlásit se
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Jste u nás poprvé?{' '}
          <Link
            to="/sign-up"
            className="font-medium text-brand-700 hover:text-brand-800"
          >
            Vytvořit účet
          </Link>
        </p>
      </div>
    </div>
  )
}
