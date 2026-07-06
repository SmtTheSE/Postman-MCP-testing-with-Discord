import { createVoiceChannelViaMcp } from '../lib/createChannel.js'
import { requireDiscordToken } from '../lib/apiAuth.js'
import { getSession } from '../lib/session.js'
import { buildBotInviteUrl } from '../lib/botInvite.js'
import { getDiscordConfig, formatDiscordApiError, isRateLimitError, formatRateLimitError } from '../lib/discordOAuth.js'

async function botInviteForGuild(guildId) {
  try {
    const { clientId } = await getDiscordConfig()
    return buildBotInviteUrl(clientId, guildId)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const accessToken = await requireDiscordToken(req, res)
    const session = await getSession(req)

    const result = await createVoiceChannelViaMcp({
      ...req.body,
      accessToken,
      userId: session?.userId,
    })

    res.status(200).json(result)
  } catch (err) {
    const raw = err.message || 'Failed to create channel'
    const message = formatDiscordApiError(raw, err.code)
    const isRL = isRateLimitError(raw)
    const botInviteUrl =
      err.code === 'BOT_NOT_IN_GUILD' ? await botInviteForGuild(req.body?.guildId) : undefined

    res.status(isRL ? 429 : err.status || 500).json({
      error: isRL ? formatRateLimitError(raw) : message,
      code: err.code,
      botInviteUrl,
      details: err.details,
    })
  }
}
