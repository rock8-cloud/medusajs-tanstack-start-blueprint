import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "#/lib/sdk"
import { errorMessage } from "#/lib/format"
import { jsonSafe } from "#/lib/json-safe"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { getRegion } from "./regions"

const CART_FIELDS =
  "*items,*region,*items.product,*items.variant,*items.thumbnail,*items.metadata,+items.total,+items.subtotal,*promotions,+shipping_methods.name,*billing_address"

const retrieveCart = async (
  fields: string = CART_FIELDS
): Promise<HttpTypes.StoreCart | null> => {
  const id = getCartId()

  if (!id) {
    return null
  }

  return sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: { fields },
      headers: { ...getAuthHeaders() },
    })
    .then(({ cart }) => cart)
    .catch(() => null)
}

const getOrSetCart = async (): Promise<HttpTypes.StoreCart> => {
  const region = await getRegion()
  let cart = await retrieveCart("id,region_id")
  const headers = { ...getAuthHeaders() }

  if (!cart) {
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id },
      {},
      headers
    )
    cart = cartResp.cart
    setCartId(cart.id)
  }

  if (cart.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
  }

  return cart
}

export const getCartFn = createServerFn({ method: "GET" }).handler(
  async () => jsonSafe(await retrieveCart())
)

export const addToCartFn = createServerFn({ method: "POST" })
  .validator((input: { variantId: string; quantity: number }) => input)
  .handler(async ({ data }) => {
    try {
      const cart = await getOrSetCart()

      await sdk.store.cart.createLineItem(
        cart.id,
        { variant_id: data.variantId, quantity: data.quantity },
        {},
        { ...getAuthHeaders() }
      )

      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const updateLineItemFn = createServerFn({ method: "POST" })
  .validator((input: { lineId: string; quantity: number }) => input)
  .handler(async ({ data }) => {
    const cartId = getCartId()

    if (!cartId) {
      return { success: false as const, error: "No cart found" }
    }

    try {
      await sdk.store.cart.updateLineItem(
        cartId,
        data.lineId,
        { quantity: data.quantity },
        {},
        { ...getAuthHeaders() }
      )
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const deleteLineItemFn = createServerFn({ method: "POST" })
  .validator((input: { lineId: string }) => input)
  .handler(async ({ data }) => {
    const cartId = getCartId()

    if (!cartId) {
      return { success: false as const, error: "No cart found" }
    }

    try {
      await sdk.store.cart.deleteLineItem(cartId, data.lineId, {}, {
        ...getAuthHeaders(),
      })
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const applyPromotionFn = createServerFn({ method: "POST" })
  .validator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const cartId = getCartId()

    if (!cartId) {
      return { success: false as const, error: "No cart found" }
    }

    try {
      await sdk.store.cart.update(
        cartId,
        { promo_codes: [data.code] },
        {},
        { ...getAuthHeaders() }
      )
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export type CheckoutAddress = {
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
}

export const setCheckoutAddressFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      email: string
      shipping_address: CheckoutAddress
      billing_address?: CheckoutAddress
    }) => input
  )
  .handler(async ({ data }) => {
    const cartId = getCartId()

    if (!cartId) {
      return { success: false as const, error: "No cart found" }
    }

    try {
      await sdk.store.cart.update(
        cartId,
        {
          email: data.email,
          shipping_address: data.shipping_address,
          billing_address: data.billing_address ?? data.shipping_address,
        },
        {},
        { ...getAuthHeaders() }
      )
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const listShippingOptionsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const cartId = getCartId()

    if (!cartId) {
      return []
    }

    return sdk.client
      .fetch<HttpTypes.StoreShippingOptionListResponse>(
        `/store/shipping-options`,
        {
          method: "GET",
          query: { cart_id: cartId },
          headers: { ...getAuthHeaders() },
        }
      )
      .then(({ shipping_options }) => jsonSafe(shipping_options))
      .catch(() => [])
  }
)

export const setShippingMethodFn = createServerFn({ method: "POST" })
  .validator((input: { optionId: string }) => input)
  .handler(async ({ data }) => {
    const cartId = getCartId()

    if (!cartId) {
      return { success: false as const, error: "No cart found" }
    }

    try {
      await sdk.store.cart.addShippingMethod(
        cartId,
        { option_id: data.optionId },
        {},
        { ...getAuthHeaders() }
      )
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const listPaymentProvidersFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const region = await getRegion()

    return sdk.client
      .fetch<HttpTypes.StorePaymentProviderListResponse>(
        `/store/payment-providers`,
        {
          method: "GET",
          query: { region_id: region.id },
          headers: { ...getAuthHeaders() },
        }
      )
      .then(({ payment_providers }) =>
        payment_providers.sort((a, b) => (a.id > b.id ? 1 : -1))
      )
      .catch(() => [])
  }
)

export const initiatePaymentSessionFn = createServerFn({ method: "POST" })
  .validator((input: { providerId: string }) => input)
  .handler(async ({ data }) => {
    const cart = await retrieveCart()

    if (!cart) {
      return { success: false as const, error: "No cart found" }
    }

    try {
      await sdk.store.payment.initiatePaymentSession(
        cart,
        { provider_id: data.providerId },
        {},
        { ...getAuthHeaders() }
      )
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const placeOrderFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const cartId = getCartId()

    if (!cartId) {
      return { success: false as const, error: "No cart found", orderId: null }
    }

    try {
      const result = await sdk.store.cart.complete(cartId, {}, {
        ...getAuthHeaders(),
      })

      if (result.type === "order") {
        removeCartId()
        return { success: true as const, error: null, orderId: result.order.id }
      }

      return {
        success: false as const,
        error: result.error?.message ?? "The order could not be placed.",
        orderId: null,
      }
    } catch (error) {
      return { success: false as const, error: errorMessage(error), orderId: null }
    }
  }
)
