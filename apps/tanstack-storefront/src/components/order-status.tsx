import { Check, XCircle } from "lucide-react"
import { Badge, cx } from "#/components/ui"
import {
  ORDER_STAGES,
  ORDER_STATE_LABELS,
  type OrderState,
} from "#/lib/order-status"

const BADGE_TONES = {
  placed: "brand",
  paid: "brand",
  shipped: "amber",
  completed: "green",
  canceled: "red",
  refunded: "neutral",
} as const

export function OrderStatusBadge({ state }: { state: OrderState }) {
  return <Badge tone={BADGE_TONES[state]}>{ORDER_STATE_LABELS[state]}</Badge>
}

const STATE_NOTES: Record<OrderState, string> = {
  placed: "Objednávku jsme přijali a čekáme na úhradu.",
  paid: "Platbu jsme přijali, objednávku připravujeme k odeslání.",
  shipped: "Zásilka je na cestě k vám.",
  completed: "Objednávka byla doručena. Děkujeme!",
  canceled: "Objednávka byla zrušena.",
  refunded: "Platba za objednávku vám byla vrácena.",
}

export function OrderStatusTracker({ state }: { state: OrderState }) {
  if (state === "canceled" || state === "refunded") {
    return (
      <div className="flex items-center gap-3">
        <XCircle
          className={cx(
            "h-6 w-6 shrink-0",
            state === "canceled" ? "text-red-600" : "text-ink-soft"
          )}
          aria-hidden
        />
        <p className="text-sm text-ink">{STATE_NOTES[state]}</p>
      </div>
    )
  }

  const current = ORDER_STAGES.findIndex((stage) => stage.key === state)

  return (
    <div>
      <ol className="grid grid-cols-4 gap-2">
        {ORDER_STAGES.map((stage, index) => {
          const done = index <= current
          return (
            <li
              key={stage.key}
              className="flex flex-col items-center gap-2 text-center"
              aria-current={index === current ? "step" : undefined}
            >
              <div className="flex w-full items-center">
                <span
                  className={cx(
                    "h-0.5 flex-1",
                    index === 0 ? "invisible" : done ? "bg-brand-500" : "bg-line"
                  )}
                />
                <span
                  className={cx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                    done
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line bg-surface text-ink-soft"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </span>
                <span
                  className={cx(
                    "h-0.5 flex-1",
                    index === ORDER_STAGES.length - 1
                      ? "invisible"
                      : index < current
                        ? "bg-brand-500"
                        : "bg-line"
                  )}
                />
              </div>
              <span
                className={cx(
                  "text-xs sm:text-sm",
                  index === current ? "font-semibold text-ink" : "text-ink-soft"
                )}
              >
                {stage.label}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 text-center text-sm text-ink-soft">
        {STATE_NOTES[state]}
      </p>
    </div>
  )
}
