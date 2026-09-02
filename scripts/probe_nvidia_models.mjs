import { loadEnv } from 'vite'

const env = loadEnv('development', process.cwd(), '')
const key = env.NVIDIA_API_KEY || env.NVIDIA_NIM_API_KEY || env.NIM_API_KEY
const endpoint = `${env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1'}/chat/completions`
const models = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'meta/llama-3.1-8b-instruct',
  'nvidia/llama-3.1-nemotron-nano-8b-v1',
]

const probe = async (model) => {
  const started = performance.now()
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 28,
        stream: true,
        chat_template_kwargs: { enable_thinking: false },
        messages: [{ role: 'system', content: 'Reply with one five-word greeting only.' }, { role: 'user', content: 'hi' }],
      }),
    })
    if (!response.ok) return { model, http: response.status, elapsed_ms: Math.round(performance.now() - started) }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let firstTokenMs = null
    let received = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      received += text
      if (firstTokenMs === null && text.includes('"content"')) firstTokenMs = Math.round(performance.now() - started)
    }
    return { model, http: response.status, first_token_ms: firstTokenMs, total_ms: Math.round(performance.now() - started) }
  } catch (error) {
    return { model, error: error.message, elapsed_ms: Math.round(performance.now() - started) }
  }
}

console.log(JSON.stringify(await Promise.all(models.map(probe)), null, 2))
