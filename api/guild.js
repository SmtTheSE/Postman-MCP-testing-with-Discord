import { getGuildViaMcp } from '../lib/manageGuild.js'
import { getSession } from '../lib/session.js'
import { formatDiscordApiError, isRateLimitError, formatRateLimitError } from '../lib/discordOAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getSession(req)
  if (!session?.accessToken) {
    return res.status(401).json({ error: 'Sign in with Discord first' })
  }

  const guildId = req.query?.guild_id
  if (!guildId) {
    return res.status(400).json({ error: 'guild_id query param required' })
  }

  try {
    const guild = await getGuildViaMcp(session.accessToken, guildId)
    res.status(200).json({ guild })
  } catch (err) {
    const message = err.message || 'Failed to fetch guild'
    res.status(isRateLimitError(message) ? 429 : err.status || 500).json({
      error: isRateLimitError(message) ? formatRateLimitError(message) : formatDiscordApiError(message),
      details: err.details,
    })
  }
}
