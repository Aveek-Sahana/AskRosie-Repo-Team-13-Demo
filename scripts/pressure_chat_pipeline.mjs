const total = Number(process.argv[2] || 4)

async function ask(index) {
  const started = Date.now()
  const response = await fetch('http://127.0.0.1:4173/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'artwork', messages: [{ role: 'user', content: 'hi' }] }),
  })
  if (!response.ok || !response.body) throw new Error(`request ${index}: HTTP ${response.status}`)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''; let answer = ''; let firstTokenMs = null
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n'); buffer = events.pop() || ''
    for (const eventText of events) {
      const data = eventText.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim()
      if (!data || data === '[DONE]') continue
      const event = JSON.parse(data)
      if (event.error) throw new Error(`request ${index}: ${event.error}`)
      if (event.delta) { answer += event.delta; firstTokenMs ??= Date.now() - started }
    }
  }
  if (!answer) throw new Error(`request ${index}: empty answer`)
  return { firstTokenMs, totalMs: Date.now() - started }
}

const results = await Promise.all(Array.from({ length: total }, (_, index) => ask(index)))
console.log(JSON.stringify({ requests: total, successful: results.length, first_token_ms: results.map((result) => result.firstTokenMs), total_ms: results.map((result) => result.totalMs) }))
