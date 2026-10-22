// Customer-facing order state, derived from what Medusa already computes on
// every store order: `status`, `payment_status` and `fulfillment_status`.

export type OrderStage = "placed" | "paid" | "shipped" | "completed"
export type OrderState = OrderStage | "canceled" | "refunded"

type OrderLike = {
  status?: string | null
  payment_status?: string | null
  fulfillment_status?: string | null
}

export const ORDER_STAGES: { key: OrderStage; label: string }[] = [
  { key: "placed", label: "Přijata" },
  { key: "paid", label: "Zaplacena" },
  { key: "shipped", label: "Na cestě" },
  { key: "completed", label: "Dokončena" },
]

export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  placed: "Přijata",
  paid: "Zaplacena",
  shipped: "Na cestě",
  completed: "Dokončena",
  canceled: "Zrušena",
  refunded: "Platba vrácena",
}

export const getOrderState = (order: OrderLike): OrderState => {
  const payment = order.payment_status ?? ""
  const fulfillment = order.fulfillment_status ?? ""

  if (order.status === "canceled") return "canceled"
  if (payment === "refunded") return "refunded"
  if (order.status === "completed" || fulfillment === "delivered") {
    return "completed"
  }
  if (
    fulfillment === "shipped" ||
    fulfillment === "partially_shipped" ||
    fulfillment === "partially_delivered"
  ) {
    return "shipped"
  }
  if (payment === "captured" || payment === "partially_refunded") {
    return "paid"
  }
  return "placed"
}
