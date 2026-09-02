const officialImage = 'https://dam.aweoffice.org/AssetLink/13tv838a7u7466r1xnu000px60d88j51.jpg'
const imageResponse = await fetch(officialImage)
if (!imageResponse.ok) throw new Error(`Official image returned ${imageResponse.status}`)
const imageDataUrl = `data:image/jpeg;base64,${Buffer.from(await imageResponse.arrayBuffer()).toString('base64')}`
const response = await fetch('http://127.0.0.1:4173/api/classify', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageDataUrl }),
})
const result = await response.json()
console.log(JSON.stringify({ http: response.status, matched: result.matched, title: result.artwork?.title || null, artist: result.artwork?.artist || null, needs_confirmation: result.needsConfirmation || false, reason: result.reason || null }))
if (!response.ok) throw new Error(`Classifier HTTP ${response.status}`)
