import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "#/lib/sdk"
import { errorMessage } from "#/lib/format"
import { jsonSafe } from "#/lib/json-safe"
import {
  getAuthHeaders,
  getCartId,
  getPendingCustomer,
  removeAuthToken,
  removeCartId,
  removePendingCustomer,
  setAuthToken,
  setPendingCustomer,
} from "./cookies"

export type CustomerAuthState =
  | { state: "error"; error: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }

// Requests a verification email. The request must be authenticated with the
// token returned by register (or by a login that requires verification).
const requestVerificationEmail = async (email: string, token: string) => {
  await sdk.auth.verification.request(
    { entity_id: email, entity_type: "email" },
    { authorization: `Bearer ${token}` }
  )
}

const transferCart = async () => {
  const cartId = getCartId()

  if (!cartId) {
    return
  }

  await sdk.store.cart.transferCart(cartId, {}, { ...getAuthHeaders() })
}

// Logs the customer in and reconciles the customer record. The behavior is
// driven entirely by the backend's login response, so it works whether or not
// email verification is enabled.
const completeLogin = async (
  email: string,
  password: string
): Promise<CustomerAuthState> => {
  let result: Awaited<ReturnType<typeof sdk.auth.login>>

  try {
    result = await sdk.auth.login("customer", "emailpass", { email, password })
  } catch (error) {
    return { state: "error", error: errorMessage(error) }
  }

  // A `location` is returned by third-party auth providers, which this flow
  // doesn't support.
  if (typeof result === "object" && "location" in result) {
    return {
      state: "error",
      error: "This login method isn't supported by the storefront.",
    }
  }

  // The backend requires email verification and this customer hasn't verified
  // yet. Send the verification email and ask them to check their inbox.
  if (
    typeof result === "object" &&
    "verification_required" in result &&
    result.verification_required
  ) {
    try {
      await requestVerificationEmail(email, result.token)
    } catch {
      // Ignore: the customer can retry by logging in again.
    }
    return { state: "verification_required", email }
  }

  if (typeof result !== "string") {
    return {
      state: "error",
      error: "Authentication requires additional steps that aren't supported.",
    }
  }

  let token = result

  // The token may not be tied to a customer record yet — right after
  // registration, or after verifying a brand-new account. A failed retrieve
  // means the customer record still needs to be created, followed by a fresh
  // login to obtain a customer-bound token.
  const customerExists = await sdk.store.customer
    .retrieve({}, { authorization: `Bearer ${token}` })
    .then(() => true)
    .catch(() => false)

  if (!customerExists) {
    const pending = getPendingCustomer()

    try {
      await sdk.store.customer.create(
        {
          email,
          first_name: pending?.first_name,
          last_name: pending?.last_name,
          phone: pending?.phone,
        },
        {},
        { authorization: `Bearer ${token}` }
      )

      token = (await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      })) as string
    } catch (error) {
      return { state: "error", error: errorMessage(error) }
    }

    removePendingCustomer()
  }

  setAuthToken(token)

  try {
    await transferCart()
  } catch {
    // A cart that can't be transferred is dropped; the customer starts a new one.
    removeCartId()
  }

  return { state: "success" }
}

export const getCustomerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const authHeaders = getAuthHeaders()

    if (!("authorization" in authHeaders)) {
      return null
    }

    return sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        headers: authHeaders,
      })
      .then(({ customer }) => jsonSafe(customer))
      .catch(() => null)
  }
)

export const loginFn = createServerFn({ method: "POST" })
  .validator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => completeLogin(data.email, data.password))

export const signupFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      email: string
      password: string
      first_name: string
      last_name: string
      phone?: string
    }) => input
  )
  .handler(async ({ data }): Promise<CustomerAuthState> => {
    try {
      await sdk.auth.register("customer", "emailpass", {
        email: data.email,
        password: data.password,
      })
    } catch (error) {
      // An existing identity (e.g. an admin user with the same email) is
      // expected and handled: the customer can still log in to link a
      // customer record. Any other error is surfaced.
      const fetchError = error as { statusText?: string; message?: string }
      if (
        fetchError.statusText !== "Unauthorized" ||
        fetchError.message !== "Identity with email already exists"
      ) {
        return { state: "error", error: errorMessage(error) }
      }
    }

    // Persist the extra signup fields. The customer record is created during
    // login, which is deferred until after email verification when the
    // backend requires it.
    setPendingCustomer({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
    })

    return completeLogin(data.email, data.password)
  })

// Confirms a customer's email using the token from the verification link.
// The confirm route doesn't require authentication, so this works even when
// the link is opened on a different device.
export const confirmVerificationFn = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    try {
      await sdk.auth.verification.confirm({ code: data.token })
      return { success: true as const, error: null }
    } catch (error) {
      return { success: false as const, error: errorMessage(error) }
    }
  })

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  try {
    await sdk.auth.logout()
  } catch {
    // The cookie removal below is what actually signs the customer out.
  }

  removeAuthToken()
  removeCartId()

  return { success: true as const }
})
