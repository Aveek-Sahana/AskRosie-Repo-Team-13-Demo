import http from 'node:http'
import { createServer as createViteServer } from 'vite'

const port = Number(process.env.PORT || 4173)
const maxRequestBytes = Number(process.env.API_MAX_REQUEST_BYTES || 2_500_000)
const allowedOrigin = process.env.ALLOWED_ORIGIN || ''
const windows = new Map()

const policy = {
  '/api/classify': { limit: 10, windowMs: 10 * 60_000 },
  '/api/chat': { limit: 30, windowMs: 10 * 60_000 },
  '/api/resolve-artwork': { limit: 30, windowMs: 10 * 60_000 },
  '/api/moderate-word': { limit: 20, windowMs: 10 * 60_000 },
}

function clientAddress(req) {
  // A deployed reverse proxy supplies this header. The first value is the client address.
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim()
}

function reject(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify({ error: message }))
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin
  if (!origin || !allowedOrigin) return true
  return origin === allowedOrigin
}

function isWithinRateLimit(req) {
  const route = policy[req.url?.split('?')[0]]
  if (!route) return true
  const now = Date.now()
  const key = `${req.url?.split('?')[0]}:${clientAddress(req)}`
  const current = windows.get(key)
  const entry = !current || now >= current.resetAt ? { count: 0, resetAt: now + route.windowMs } : current
  entry.count += 1
  windows.set(key, entry)
  return entry.count <= route.limit
}

const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })

const server = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=()')

  if (req.url?.startsWith('/api/')) {
    const length = Number(req.headers['content-length'] || 0)
    if (!isAllowedOrigin(req)) return reject(res, 403, 'Request origin is not allowed.')
    if (!Number.isFinite(length) || length > maxRequestBytes) return reject(res, 413, 'That image is too large. Please choose a smaller photo.')
    if (!isWithinRateLimit(req)) return reject(res, 429, 'Please wait a moment before trying again.')
  }
  vite.middlewares(req, res, () => {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'Not found.' }))
  })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`AskRosie production server listening on ${port}`)
})
