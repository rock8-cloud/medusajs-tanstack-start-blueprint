import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "#/lib/sdk"
import { errorMessage } from "#/lib/format"
import { jsonSafe } from "#/lib/json-safe"
import { getAuthHeaders } from "./cookies"

export const updateCustomerFn = createServerFn({ method: "POST" })
  .validator(
    (input: { first_name?: string; last_name?: string; phone?: string }) =>
      input
  )
  .handler(async ({ data }) => {
    try {
      const { customer } = await sdk.store.customer.update(data, {}, {
        ...getAuthHeaders(),
      })
      return { success: true as const, error: null, customer: jsonSafe(customer) }
    } catch (error) {
      return { success: false as const, error: errorMessage(error), customer: null }
    }
  })

export type AddressInput = {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  province?: string
  country_code: string
  phone?: string
  is_default_shipping?: boolean
  is_default_billing?: boolean
}

export const addAddressFn = createServerFn({ method: "POST" })
  .validator((input: AddressInput) => input)
  .handler(async ({ data }) => {
    try {
      await sdk.store.customer.createAddress(data, {}, { ...getAuthHeaders() })
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const updateAddressFn = createServerFn({ method: "POST" })
  .validator((input: { addressId: string; address: AddressInput }) => input)
  .handler(async ({ data }) => {
    try {
      await sdk.store.customer.updateAddress(
        data.addressId,
        data.address,
        {},
        { ...getAuthHeaders() }
      )
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const deleteAddressFn = createServerFn({ method: "POST" })
  .validator((input: { addressId: string }) => input)
  .handler(async ({ data }) => {
    try {
      await sdk.store.customer.deleteAddress(data.addressId, {
        ...getAuthHeaders(),
      })
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const listOrdersFn = createServerFn({ method: "GET" })
  .validator((input: { limit?: number; offset?: number }) => input)
  .handler(async ({ data }) => {
    return sdk.client
      .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
        method: "GET",
        query: {
          limit: data.limit ?? 10,
          offset: data.offset ?? 0,
          order: "-created_at",
          fields: "*items,+items.metadata,*items.variant,*items.product",
        },
        headers: { ...getAuthHeaders() },
      })
      .then(({ orders }) => jsonSafe(orders))
      .catch(() => [])
  })

export const getOrderFn = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    return sdk.client
      .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${data.id}`, {
        method: "GET",
        query: {
          fields:
            "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,+items.subtotal",
        },
        headers: { ...getAuthHeaders() },
      })
      .then(({ order }) => jsonSafe(order))
      .catch(() => null)
  })
