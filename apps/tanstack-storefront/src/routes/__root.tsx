import { useEffect } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { Navbar } from '#/components/navbar'
import { Footer } from '#/components/footer'
import { ToastProvider } from '#/components/toast'
import { getCustomerFn } from '#/lib/server/auth'
import { getCartFn } from '#/lib/server/cart'
import { listCategoriesFn } from '#/lib/server/categories'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  loader: async () => {
    const [customer, cart, categories] = await Promise.all([
      getCustomerFn(),
      getCartFn(),
      listCategoriesFn().catch(() => []),
    ])

    return { customer, cart, categories }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Medusa Store',
      },
      {
        name: 'theme-color',
        content: '#023047',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
})

function RootLayout() {
  const { customer, cart, categories } = Route.useLoaderData()

  const cartCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar customer={customer} cartCount={cartCount} />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer categories={categories} />
      </div>
    </ToastProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      void import('react-grab')
    }
  }, [])

  return (
    <html lang="cs">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
