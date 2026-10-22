// Production Node server for the built TanStack Start app.
// `vite build` emits a bare Web `fetch` handler at dist/server/server.js (no
// self-listening server, no Nitro in this version), plus static client assets
// in dist/client. This adapter serves those assets and delegates everything
// else (routes + server functions) to the fetch handler. Deps-free, runs on
// the plain Node 22 runtime shipped in the Docker image.
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const CLIENT_DIR = join(rootDir, 'dist', 'client')
const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'

const { default: handler } = await import('./dist/server/server.js')

const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

function resolveStatic(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  if (!rel || rel.includes('\0')) return null
  const filePath = normalize(join(CLIENT_DIR, rel))
  if (filePath !== CLIENT_DIR && !filePath.startsWith(CLIENT_DIR + '/')) return null
  try {
    if (statSync(filePath).isFile()) return filePath
  } catch {}
  return null
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    // Static client assets (hashed files under /assets get immutable caching).
    if (req.method === 'GET' || req.method === 'HEAD') {
      const file = resolveStatic(url.pathname)
      if (file) {
        res.writeHead(200, {
          'content-type': MIME[extname(file)] || 'application/octet-stream',
          'cache-control': url.pathname.startsWith('/assets/')
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=3600',
        })
        if (req.method === 'HEAD') return res.end()
        return createReadStream(file).pipe(res)
      }
    }

    // Delegate routes + server functions to the SSR fetch handler.
    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x))
      else if (v != null) headers.set(k, v)
    }
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const request = new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? Readable.toWeb(req) : undefined,
      duplex: hasBody ? 'half' : undefined,
    })

    const response = await handler.fetch(request)

    const outHeaders = {}
    for (const [k, v] of response.headers) {
      if (k.toLowerCase() !== 'set-cookie') outHeaders[k] = v
    }
    const setCookies = response.headers.getSetCookie?.() ?? []
    if (setCookies.length) outHeaders['set-cookie'] = setCookies

    res.writeHead(response.status, outHeaders)
    if (response.body) Readable.fromWeb(response.body).pipe(res)
    else res.end()
  } catch (err) {
    console.error('SSR error:', err)
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' })
    res.end('Internal Server Error')
  }
})

server.listen(PORT, HOST, () => {
  console.log(`storefront listening on http://${HOST}:${PORT}`)
})
