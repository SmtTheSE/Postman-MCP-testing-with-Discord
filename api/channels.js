import {
  listGuildChannelsViaMcp,
  getChannelViaMcp,
  updateChannelViaMcp,
  deleteChannelViaMcp,
} from '../lib/manageChannels.js'
import { requireDiscordToken } from '../lib/apiAuth.js'
import { getSession } from '../lib/session.js'
import { assertUserGuildAccess, assertUserInGuild, PERMISSION } from '../lib/guildAuth.js'
import { buildBotInviteUrl } from '../lib/botInvite.js'
import { clampVoiceBitrate } from '../lib/voiceBitrate.js'
import { getDiscordConfig, formatDiscordApiError, formatRateLimitError, isRateLimitError } from '../lib/discordOAuth.js'

function groupVoiceChannels(channels) {
  const categories = Object.fromEntries(
    channels.filter((c) => c.type === 4).map((c) => [c.id, c.name]),
  )

  const voice = channels
    .filter((c) => c.type === 2)
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      guild_id: c.guild_id,
      parent_id: c.parent_id || null,
      categoryName: c.parent_id ? categories[c.parent_id] || null : null,
      bitrate: c.bitrate,
      user_limit: c.user_limit,
      rtc_region: c.rtc_region,
      topic: c.topic,
      position: c.position,
    }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return { voice, categories: Object.entries(categories).map(([id, name]) => ({ id, name })) }
}

async function botInviteForGuild(guildId) {
  try {
    const { clientId } = await getDiscordConfig()
    return buildBotInviteUrl(clientId, guildId)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  try {
    const accessToken = await requireDiscordToken(req, res)
    const session = await getSession(req)
    const userId = session?.userId

    if (req.method === 'GET') {
      if (req.query.guild_id) {
        if (req.query.scope === 'jukebox') {
          await assertUserInGuild(accessToken, req.query.guild_id, userId)
        } else {
          await assertUserGuildAccess(
            accessToken,
            req.query.guild_id,
            PERMISSION.MANAGE_CHANNELS,
            'Manage Channels',
            userId,
          )
        }
        const channels = await listGuildChannelsViaMcp(accessToken, req.query.guild_id)
        const grouped = groupVoiceChannels(channels)
        return res.status(200).json({
          channels: grouped.voice,
          categories: grouped.categories,
          total: channels.length,
          voiceCount: grouped.voice.length,
        })
      }
      if (req.query.channel_id) {
        const channel = await getChannelViaMcp(accessToken, req.query.channel_id)
        if (channel?.guild_id) {
          await assertUserGuildAccess(
            accessToken,
            channel.guild_id,
            PERMISSION.MANAGE_CHANNELS,
            'Manage Channels',
            userId,
          )
        }
        return res.status(200).json({ channel })
      }
      return res.status(400).json({ error: 'Provide guild_id or channel_id query param' })
    }

    if (req.method === 'PATCH') {
      const { channel_id, name, bitrate, user_limit, rtc_region, topic, parent_id } = req.body
      if (!channel_id) return res.status(400).json({ error: 'channel_id required' })

      const existing = await getChannelViaMcp(accessToken, channel_id)
      if (existing?.guild_id) {
        await assertUserGuildAccess(
          accessToken,
          existing.guild_id,
          PERMISSION.MANAGE_CHANNELS,
          'Manage Channels',
          userId,
        )
      }

      const updates = {}
      if (name !== undefined) updates.name = name
      if (bitrate !== undefined) updates.bitrate = clampVoiceBitrate(bitrate)
      if (user_limit !== undefined) updates.user_limit = user_limit
      if (rtc_region !== undefined) updates.rtc_region = rtc_region
      if (topic !== undefined) updates.topic = topic
      if (parent_id !== undefined) updates.parent_id = parent_id
      const result = await updateChannelViaMcp(accessToken, channel_id, updates)
      return res.status(200).json({ channel: result })
    }

    if (req.method === 'DELETE') {
      const { channel_id } = req.body
      if (!channel_id) return res.status(400).json({ error: 'channel_id required' })

      const existing = await getChannelViaMcp(accessToken, channel_id)
      if (existing?.guild_id) {
        await assertUserGuildAccess(
          accessToken,
          existing.guild_id,
          PERMISSION.MANAGE_CHANNELS,
          'Manage Channels',
          userId,
        )
      }

      await deleteChannelViaMcp(accessToken, channel_id)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const raw = err.message || 'Channel operation failed'
    const message = formatDiscordApiError(raw, err.code)
    const isRL = isRateLimitError(raw)
    const status = err.status || (isRL ? 429 : 500)
    const botInviteUrl =
      err.code === 'BOT_NOT_IN_GUILD' ? await botInviteForGuild(req.query?.guild_id || req.body?.guild_id) : undefined

    return res.status(status).json({
      error: isRL ? formatRateLimitError(raw) : message,
      code: err.code,
      botInviteUrl,
      details: err.details,
    })
  }
}
