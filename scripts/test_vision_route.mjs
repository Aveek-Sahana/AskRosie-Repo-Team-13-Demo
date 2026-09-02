import { readFile } from 'node:fs/promises'

const question = process.argv[2] || 'Describe the person in this uploaded image in one sentence.'
const imageDataUrl = `data:image/png;base64,${(await readFile('public/rosie-avatar.png')).toString('base64')}`
const response = await fetch('http://127.0.0.1:4173/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mode: 'artwork',
    imageDataUrl,
    messages: [{ role: 'user', content: question }],
  }),
})
console.log(`http=${response.status} content_type=${response.headers.get('content-type')}`)
const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''
let answer = ''
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split('\n\n')
  buffer = events.pop() || ''
  for (const eventText of events) {
    const data = eventText.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim()
    if (!data || data === '[DONE]') continue
    const event = JSON.parse(data)
    if (event.error) throw new Error(event.error)
    answer += event.delta || ''
  }
}
if (!answer) throw new Error('No vision answer received')
console.log(answer)
