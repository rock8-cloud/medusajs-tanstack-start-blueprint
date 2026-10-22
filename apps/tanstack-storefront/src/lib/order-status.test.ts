import { describe, expect, it } from "vitest"
import { getOrderState } from "./order-status"

describe("getOrderState", () => {
  it("is placed right after checkout (payment only authorized)", () => {
    expect(
      getOrderState({
        status: "pending",
        payment_status: "authorized",
        fulfillment_status: "not_fulfilled",
      })
    ).toBe("placed")
  })

  it("is paid once the payment is captured", () => {
    expect(
      getOrderState({ status: "pending", payment_status: "captured" })
    ).toBe("paid")
  })

  it("stays paid while the parcel is only packed", () => {
    expect(
      getOrderState({
        status: "pending",
        payment_status: "captured",
        fulfillment_status: "fulfilled",
      })
    ).toBe("paid")
  })

  it("is shipped once any fulfillment is shipped", () => {
    expect(
      getOrderState({
        status: "pending",
        payment_status: "captured",
        fulfillment_status: "partially_shipped",
      })
    ).toBe("shipped")
  })

  it("is completed when delivered or completed", () => {
    expect(getOrderState({ fulfillment_status: "delivered" })).toBe("completed")
    expect(getOrderState({ status: "completed" })).toBe("completed")
  })

  it("cancellation wins over everything", () => {
    expect(
      getOrderState({
        status: "canceled",
        payment_status: "captured",
        fulfillment_status: "shipped",
      })
    ).toBe("canceled")
  })

  it("flags a fully refunded order", () => {
    expect(
      getOrderState({ status: "pending", payment_status: "refunded" })
    ).toBe("refunded")
  })
})
