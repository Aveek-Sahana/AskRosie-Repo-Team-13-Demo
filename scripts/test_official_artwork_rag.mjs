const artwork = { title: '"It Is Very Queer, Isn\'t It?"', artist: 'James Henry Beard', slug: '2007-179', sourceUrl: 'https://crystalbridges.org/artworks/2007-179' }
const response = await fetch('http://127.0.0.1:4173/api/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'artwork', identifiedArtwork: artwork, messages: [{ role: 'user', content: 'What does the official record say this chimpanzee is pondering?' }] }),
})
if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)
const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let answer = ''
while (true) {
  const { value, done } = await reader.read(); if (done) break
  buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || ''
  for (const eventText of events) {
    const data = eventText.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim()
    if (!data || data === '[DONE]') continue
    const event = JSON.parse(data); if (event.error) throw new Error(event.error); answer += event.delta || ''
  }
}
if (!answer.trim() || !/James Henry Beard|Very Queer|official record/i.test(answer)) throw new Error(`Official-record response was not tied to the confirmed artwork: ${answer}`)
console.log(JSON.stringify({ grounded_answer: answer }))
