import { Link, createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { confirmVerificationFn } from '#/lib/server/auth'

type VerifySearch = { token?: string }

export const Route = createFileRoute('/verify-account')({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  head: () => ({
    meta: [{ title: 'Ověření účtu — Medusa Store' }],
  }),
  component: VerifyAccountPage,
})

function VerifyAccountPage() {
  const { token } = Route.useSearch()
  const [state, setState] = useState<'pending' | 'success' | 'error'>(
    token ? 'pending' : 'error'
  )
  const [error, setError] = useState<string | null>(
    token ? null : 'V ověřovacím odkazu chybí token.'
  )
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true

    confirmVerificationFn({ data: { token } }).then((result) => {
      if (result.success) {
        setState('success')
      } else {
        setState('error')
        setError(
          result.error ??
            'Ověřovací odkaz je neplatný nebo vypršel. Přihlaste se pro zaslání nového.'
        )
      }
    })
  }, [token])

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        {state === 'pending' && (
          <>
            <Loader2
              className="mx-auto h-10 w-10 animate-spin text-brand-600"
              aria-hidden
            />
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">
              Ověřujeme váš e-mail…
            </h1>
          </>
        )}

        {state === 'success' && (
          <>
            <CheckCircle2
              className="mx-auto h-10 w-10 text-green-600"
              aria-hidden
            />
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">
              E-mail ověřen
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Vaše e-mailová adresa je potvrzená. Přihlaste se a dokončete
              nastavení účtu.
            </p>
            <Link
              to="/sign-in"
              search={{}}
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-brand-900 hover:bg-accent-strong"
            >
              Přihlásit se
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-600" aria-hidden />
            <h1 className="mt-4 font-display text-2xl font-bold text-ink">
              Ověření se nezdařilo
            </h1>
            <p className="mt-2 text-sm text-ink-soft">{error}</p>
            <Link
              to="/sign-in"
              search={{}}
              className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-ink hover:border-brand-400"
            >
              Přejít na přihlášení
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
