import { apiGuard, classify, readBody } from './_rosie.js'
export default async function handler(req, res) {
  if (!apiGuard(req, res, { limit: 10 })) return
  const result = await classify(String(readBody(req).imageDataUrl || ''))
  res.status(200).json(result)
}
