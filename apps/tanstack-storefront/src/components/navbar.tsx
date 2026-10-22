import { Link, useNavigate } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { Menu, Search, ShoppingCart, UserRound, X } from "lucide-react"
import { useState, type FormEvent } from "react"

function SearchForm({
  className,
  onSubmitted,
}: {
  className?: string
  onSubmitted?: () => void
}) {
  const navigate = useNavigate()

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const q = new FormData(event.currentTarget).get("q")?.toString().trim()
    navigate({ to: "/products", search: q ? { q } : {} })
    onSubmitted?.()
  }

  return (
    <form role="search" onSubmit={onSubmit} className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-200"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          aria-label="Hledat produkty"
          placeholder="Hledat produkty…"
          className="min-h-11 w-full rounded-lg border border-brand-700 bg-brand-800 py-2 pl-9 pr-3 text-sm text-white placeholder:text-brand-200 focus:border-accent focus:outline-2 focus:outline-offset-1 focus:outline-accent/40"
        />
      </div>
    </form>
  )
}

export function Navbar({
  customer,
  cartCount,
}: {
  customer: HttpTypes.StoreCustomer | null
  cartCount: number
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLink =
    "rounded-lg px-3 py-2 text-sm font-medium text-brand-100 transition-colors hover:bg-brand-800 hover:text-white [&.active]:text-accent [&.active]:bg-brand-800"

  return (
    <header className="sticky top-0 z-40 border-b border-brand-800 bg-brand-900 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-brand-800 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          to="/"
          className="flex items-baseline gap-2 font-display text-2xl font-extrabold uppercase tracking-tight text-white"
          onClick={() => setMenuOpen(false)}
        >
          Medusa Store
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Hlavní">
          <Link to="/products" className={navLink}>
            Všechny produkty
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchForm className="hidden w-56 lg:block" />

          <Link
            to={customer ? "/account" : "/sign-in"}
            className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-brand-100 hover:bg-brand-800 hover:text-white"
          >
            <UserRound className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">
              {customer ? (customer.first_name ?? "Můj účet") : "Přihlásit se"}
            </span>
          </Link>

          {!customer && (
            <Link
              to="/sign-up"
              className="hidden h-11 items-center rounded-lg bg-accent px-3 text-sm font-semibold text-brand-900 hover:bg-accent/90 sm:flex"
            >
              Registrace
            </Link>
          )}

          <Link
              to="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-brand-800"
              aria-label={`Košík, položek: ${cartCount}`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              <span
                aria-live="polite"
                className={
                  cartCount > 0
                    ? "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-brand-900"
                    : "sr-only"
                }
              >
                {cartCount > 0 ? cartCount : `Košík, položek: ${cartCount}`}
              </span>
            </Link>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-brand-800 bg-brand-900 px-4 pb-4 pt-3 md:hidden"
        >
          <SearchForm className="mb-3" onSubmitted={() => setMenuOpen(false)} />
          <nav className="flex flex-col gap-1" aria-label="Mobilní">
            <Link
              to="/products"
              className="rounded-lg px-3 py-3 text-base font-medium text-white hover:bg-brand-800"
              onClick={() => setMenuOpen(false)}
            >
              Všechny produkty
            </Link>
            <Link
              to={customer ? "/account" : "/sign-in"}
              className="rounded-lg px-3 py-3 text-base font-medium text-white hover:bg-brand-800"
              onClick={() => setMenuOpen(false)}
            >
              {customer ? "Můj účet" : "Přihlásit se"}
            </Link>
            {!customer && (
              <Link
                to="/sign-up"
                className="rounded-lg px-3 py-3 text-base font-medium text-accent hover:bg-brand-800"
                onClick={() => setMenuOpen(false)}
              >
                Registrace
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
