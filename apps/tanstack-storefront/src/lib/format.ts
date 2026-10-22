export const formatPrice = (
  amount: number | null | undefined,
  currencyCode: string | null | undefined
) => {
  if (amount == null || !currencyCode) {
    return "—"
  }

  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

// Czech plural: 1 produkt, 2–4 produkty, 5+ produktů
export const czPlural = (
  n: number,
  [one, few, many]: [string, string, string]
) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many)

export const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.replace(/^(Error|FetchError): /, "")
  }
  return String(error)
}
