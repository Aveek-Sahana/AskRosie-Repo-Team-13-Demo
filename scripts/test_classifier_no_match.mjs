import { readFile } from 'node:fs/promises'

const imageDataUrl = `data:image/png;base64,${(await readFile('public/rosie-avatar.png')).toString('base64')}`
const response = await fetch('http://127.0.0.1:4173/api/classify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageDataUrl }),
})
const result = await response.json()
console.log(JSON.stringify({ http: response.status, matched: result.matched, hasArtwork: Boolean(result.artwork), reason: result.reason || null }))
if (response.status !== 200 || result.matched !== false) throw new Error('The non-catalog image should not receive a catalog match.')
