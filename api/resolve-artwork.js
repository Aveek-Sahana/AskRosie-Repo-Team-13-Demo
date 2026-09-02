import { apiGuard, readBody, resolveArtwork } from './_rosie.js'
export default async function handler(req, res) {
  if (!apiGuard(req, res)) return
  const body = readBody(req)
  const result = await resolveArtwork(String(body.title || '').slice(0, 160), String(body.artist || '').slice(0, 120))
  res.status(200).json(result)
}
