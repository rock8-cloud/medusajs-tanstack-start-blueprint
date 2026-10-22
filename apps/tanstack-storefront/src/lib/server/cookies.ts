import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server"

const AUTH_COOKIE = "_medusa_jwt"
const CART_COOKIE = "_medusa_cart_id"
const PENDING_COOKIE = "_medusa_pending_customer"

const baseOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: import.meta.env.PROD,
  path: "/",
}

export const getAuthHeaders = ():
  | { authorization: string }
  | Record<string, never> => {
  const token = getCookie(AUTH_COOKIE)

  if (!token) {
    return {}
  }

  return { authorization: `Bearer ${token}` }
}

export const isLoggedIn = () => Boolean(getCookie(AUTH_COOKIE))

export const setAuthToken = (token: string) => {
  setCookie(AUTH_COOKIE, token, { ...baseOptions, maxAge: 60 * 60 * 24 * 7 })
}

export const removeAuthToken = () => {
  deleteCookie(AUTH_COOKIE, { path: "/" })
}

export const getCartId = () => getCookie(CART_COOKIE)

export const setCartId = (cartId: string) => {
  setCookie(CART_COOKIE, cartId, { ...baseOptions, maxAge: 60 * 60 * 24 * 7 })
}

export const removeCartId = () => {
  deleteCookie(CART_COOKIE, { path: "/" })
}

export type PendingCustomer = {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

// During the email-verification flow the customer record isn't created until
// the customer verifies their email and logs in. The extra signup fields are
// kept in a cookie so they survive the trip to the customer's inbox.
export const setPendingCustomer = (customer: PendingCustomer) => {
  setCookie(PENDING_COOKIE, JSON.stringify(customer), {
    ...baseOptions,
    maxAge: 60 * 60 * 24,
  })
}

export const getPendingCustomer = (): PendingCustomer | null => {
  const value = getCookie(PENDING_COOKIE)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as PendingCustomer
  } catch {
    return null
  }
}

export const removePendingCustomer = () => {
  deleteCookie(PENDING_COOKIE, { path: "/" })
}
