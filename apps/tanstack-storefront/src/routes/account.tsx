import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { getCustomerFn, logoutFn } from '#/lib/server/auth'

export const Route = createFileRoute('/account')({
  loader: async () => {
    const customer = await getCustomerFn()

    if (!customer) {
      throw redirect({ to: '/sign-in', search: { redirect: '/account' } })
    }

    return { customer }
  },
  head: () => ({
    meta: [{ title: 'Můj účet — Medusa Store' }],
  }),
  component: AccountLayout,
})

function AccountLayout() {
  const { customer } = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const signOut = async () => {
    setSigningOut(true)
    try {
      await logoutFn()
      await router.invalidate()
      navigate({ to: '/' })
    } finally {
      setSigningOut(false)
    }
  }

  const navLink =
    'block rounded-lg px-3.5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-ink [&.active]:bg-brand-50 [&.active]:text-brand-700'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Můj účet
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Přihlášen jako {customer.email}
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:border-brand-400 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Odhlásit se
        </button>
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[14rem_1fr]">
        <nav aria-label="Účet" className="h-fit md:sticky md:top-20">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            <li>
              <Link to="/account" activeOptions={{ exact: true }} className={navLink}>
                Přehled
              </Link>
            </li>
            <li>
              <Link to="/account/orders" className={navLink}>
                Objednávky
              </Link>
            </li>
            <li>
              <Link to="/account/addresses" className={navLink}>
                Adresy
              </Link>
            </li>
            <li>
              <Link to="/account/profile" className={navLink}>
                Profil
              </Link>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
