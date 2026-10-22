import { Link } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"

// SEO-friendly pagination: every page is a real link with the page number in
// the URL search params.
export function Pagination({
  page,
  totalPages,
  makeSearch,
}: {
  page: number
  totalPages: number
  makeSearch: (page: number) => Record<string, unknown>
}) {
  if (totalPages <= 1) {
    return null
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  )

  const items: (number | "gap")[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("gap")
    items.push(p)
  })

  const linkClass = (active: boolean) =>
    `flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
      active
        ? "border-brand-600 bg-brand-600 text-white"
        : "border-line bg-surface text-ink hover:border-brand-400"
    }`

  return (
    <nav aria-label="Stránkování" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link to="." search={makeSearch(page - 1)} className={linkClass(false)} aria-label="Předchozí stránka">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      )}
      {items.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-ink-soft">
            …
          </span>
        ) : (
          <Link
            key={item}
            to="."
            search={makeSearch(item)}
            className={linkClass(item === page)}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link to="." search={makeSearch(page + 1)} className={linkClass(false)} aria-label="Další stránka">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </nav>
  )
}
