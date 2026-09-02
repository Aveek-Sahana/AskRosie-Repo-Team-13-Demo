import { apiGuard, moderateWord, readBody } from './_rosie.js'
export default async function handler(req, res) {
  if (!apiGuard(req, res, { limit: 20 })) return
  const result = await moderateWord(readBody(req).word)
  res.status(200).json(result)
}
