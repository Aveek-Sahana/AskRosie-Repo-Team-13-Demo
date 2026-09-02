import { apiGuard, chatReply, readBody } from './_rosie.js'
export default async function handler(req, res) {
  if (!apiGuard(req, res, { limit: 30 })) return
  const body = readBody(req)
  const reply = await chatReply(body)
  if (!reply) return res.status(503).json({ error: 'Rosie is taking a short breath. Please try that once more in a moment.' })
  if (body.mode === 'quiz') return res.status(200).json({ reply })
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' })
  res.write(`data: ${JSON.stringify({ delta: reply })}\n\n`)
  res.end('data: [DONE]\n\n')
}
