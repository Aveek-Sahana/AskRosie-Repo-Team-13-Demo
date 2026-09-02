import { Readable } from 'node:stream'
import viteConfig from '../vite.config.js'

const realFetch = globalThis.fetch
let groqCalls = 0
let nvidiaCalls = 0
globalThis.fetch = async (url, options) => {
  if (String(url).includes('api.groq.com')) {
    groqCalls += 1
    return new Response('{"error":{"message":"forced Groq rate limit"}}', { status: 429, headers: { 'x-ratelimit-reset-tokens': '30s' } })
  }
  if (String(url).includes('integrate.api.nvidia.com')) nvidiaCalls += 1
  return realFetch(url, options)
}

const config = viteConfig({ mode: 'development' })
let chatHandler
const server = { middlewares: { use(path, handler) { if (path === '/api/chat') chatHandler = handler } } }
config.plugins.find((plugin) => plugin.name === 'rosie-nvidia-chat').configureServer(server)
if (!chatHandler) throw new Error('Chat middleware was not registered')

async function callChat() {
  const request = Readable.from([JSON.stringify({ mode: 'artwork', messages: [{ role: 'user', content: 'hi' }] })])
  request.method = 'POST'
  let output = ''
  const response = {
    headersSent: false, statusCode: 200,
    setHeader() {},
    writeHead(code) { this.statusCode = code; this.headersSent = true },
    write(chunk) { this.headersSent = true; output += String(chunk) },
    end(chunk = '') { output += String(chunk) },
  }
  await chatHandler(request, response)
  if (!output.includes('"delta"')) throw new Error(`Failover did not stream an AI response: ${output.slice(0, 180)}`)
}

try {
  await callChat()
  const groqCallsAfterFirst = groqCalls
  await callChat()
  if (groqCallsAfterFirst !== 1 || groqCalls !== 1) throw new Error(`Expected one Groq rate-limit call before cooldown; got ${groqCalls}`)
  if (nvidiaCalls !== 2) throw new Error(`Expected NVIDIA to answer both requests; got ${nvidiaCalls}`)
  console.log(JSON.stringify({ groq_rate_limit_calls: groqCalls, groq_circuit_breaker_active: true, nvidia_streamed_replies: nvidiaCalls }))
} finally {
  globalThis.fetch = realFetch
}
