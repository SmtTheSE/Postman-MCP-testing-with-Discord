import { createVoiceChannelViaMcp } from '../lib/createChannel.js'
import { getSession } from '../lib/session.js'
import { formatDiscordApiError } from '../lib/discordOAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getSession(req)
    if (!session?.accessToken) {
      return res.status(401).json({ error: 'Sign in with Discord first' })
    }

    const result = await createVoiceChannelViaMcp({
      ...req.body,
      accessToken: session.accessToken,
    })

    res.status(200).json(result)
  } catch (err) {
    const message = formatDiscordApiError(err.message || 'Failed to create channel')
    res.status(err.status || 500).json({
      error: message,
      details: err.details,
    })
  }
}
