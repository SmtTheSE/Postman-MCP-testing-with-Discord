import { buildDiscordAuthUrl, getRequestOrigin } from '../../lib/discordOAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const url = await buildDiscordAuthUrl(req)
    res.redirect(302, url)
  } catch (err) {
    if (err.status === 503) {
      const origin = getRequestOrigin(req)
      return res.redirect(302, `${origin}/?auth=not_configured`)
    }
    res.status(err.status || 500).json({ error: err.message })
  }
}
