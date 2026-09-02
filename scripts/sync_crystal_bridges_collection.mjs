import { mkdir, writeFile } from 'node:fs/promises'

const baseUrl = 'https://crystalbridges.org/api/collections/works'
const limit = 100
const first = await fetch(`${baseUrl}?page=1&limit=${limit}&locale=en`)
if (!first.ok) throw new Error(`Official Crystal Bridges works API returned ${first.status}`)
const firstPayload = await first.json()
const pages = Math.ceil(firstPayload.total / limit)
const all = [...firstPayload.items]
for (let page = 2; page <= pages; page += 1) {
  const response = await fetch(`${baseUrl}?page=${page}&limit=${limit}&locale=en`)
  if (!response.ok) throw new Error(`Page ${page} returned ${response.status}`)
  const payload = await response.json()
  all.push(...payload.items)
  await new Promise((resolve) => setTimeout(resolve, 100))
}
if (all.length !== firstPayload.total) throw new Error(`Expected ${firstPayload.total} works; received ${all.length}`)
await mkdir('data', { recursive: true })
const output = {
  source: 'https://crystalbridges.org/api/collections/works',
  retrievedAt: new Date().toISOString(),
  total: firstPayload.total,
  works: all,
}
await writeFile('data/crystal-bridges-works.json', JSON.stringify(output, null, 2))
console.log(JSON.stringify({ official_source: output.source, total: output.total, saved: 'data/crystal-bridges-works.json' }))
