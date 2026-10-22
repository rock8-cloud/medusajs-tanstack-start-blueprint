import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    // Vite 8's SSR environment makes start-plugin-core's dev-server plugin
    // skip installing its middleware (its auto-detect bails), so every route
    // falls through to a bare "Cannot GET /" 404. Force it on.
    tanstackStart({ vite: { installDevServerMiddleware: true } }),
    viteReact(),
  ],
  ssr: {
    noExternal: ['@medusajs/js-sdk'],
  },
})

export default config
