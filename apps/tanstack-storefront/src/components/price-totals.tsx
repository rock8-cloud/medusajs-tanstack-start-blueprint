import { formatPrice } from "#/lib/format"

type Totals = {
  item_subtotal?: number | null
  discount_total?: number | null
  discount_tax_total?: number | null
  shipping_subtotal?: number | null
  tax_total?: number | null
  total?: number | null
}

/**
 * Cart / order totals the way a VAT invoice reads: catalog prices are
 * without VAT, VAT is added on top, the total is what gets paid.
 */
export function PriceTotals({
  totals,
  currency,
  shippingPending = false,
  className = "",
}: {
  totals: Totals
  currency: string
  /** Cart before checkout: shipping isn't chosen yet. */
  shippingPending?: boolean
  className?: string
}) {
  const discount = (totals.discount_total ?? 0) - (totals.discount_tax_total ?? 0)

  return (
    <dl className={`space-y-2 border-t border-line pt-4 text-sm ${className}`}>
      <div className="flex justify-between">
        <dt className="text-ink-soft">Mezisoučet bez DPH</dt>
        <dd className="font-medium text-ink">
          {formatPrice(totals.item_subtotal ?? 0, currency)}
        </dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink-soft">Sleva</dt>
          <dd className="font-medium text-green-700">
            −{formatPrice(discount, currency)}
          </dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-soft">Doprava bez DPH</dt>
        <dd className="font-medium text-ink">
          {shippingPending
            ? "Spočítá se v pokladně"
            : formatPrice(totals.shipping_subtotal ?? 0, currency)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-soft">DPH</dt>
        <dd className="font-medium text-ink">
          {formatPrice(totals.tax_total ?? 0, currency)}
        </dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base">
        <dt className="font-semibold text-ink">Celkem s DPH</dt>
        <dd className="font-bold text-ink">
          {formatPrice(totals.total ?? 0, currency)}
        </dd>
      </div>
    </dl>
  )
}
