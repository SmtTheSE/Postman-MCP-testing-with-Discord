import {
  listChannelInvitesViaMcp,
  listGuildInvitesViaMcp,
  revokeInviteViaMcp,
} from '../lib/manageInvites.js'
import { requireDiscordToken } from '../lib/apiAuth.js'
import { getSession } from '../lib/session.js'
import { assertUserGuildAccess, PERMISSION } from '../lib/guildAuth.js'
import { buildBotInviteUrl } from '../lib/botInvite.js'
import { getDiscordConfig, formatDiscordApiError, formatRateLimitError, isRateLimitError } from '../lib/discordOAuth.js'
import { getChannel } from '../lib/discordBotApi.js'

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
      if (req.query.channel_id) {
        const channel = await getChannel(req.query.channel_id)
        if (channel?.guild_id) {
          await assertUserGuildAccess(
            accessToken,
            channel.guild_id,
            PERMISSION.MANAGE_GUILD,
            'Manage Server',
            userId,
          )
        }
        const invites = await listChannelInvitesViaMcp(accessToken, req.query.channel_id)
        return res.status(200).json({ invites })
      }
      if (req.query.guild_id) {
        await assertUserGuildAccess(
          accessToken,
          req.query.guild_id,
          PERMISSION.MANAGE_GUILD,
          'Manage Server',
          userId,
        )
        const invites = await listGuildInvitesViaMcp(accessToken, req.query.guild_id)
        const normalized = (Array.isArray(invites) ? invites : []).map((inv) => ({
          code: inv.code,
          url: inv.code ? `https://discord.gg/${inv.code}` : null,
          channel: inv.channel ? { id: inv.channel.id, name: inv.channel.name, type: inv.channel.type } : null,
          inviter: inv.inviter ? { username: inv.inviter.username } : null,
          uses: inv.uses ?? 0,
          max_uses: inv.max_uses ?? 0,
          max_age: inv.max_age ?? 0,
          expires_at: inv.expires_at ?? null,
          temporary: inv.temporary ?? false,
        }))
        return res.status(200).json({ invites: normalized })
      }
      return res.status(400).json({ error: 'Provide channel_id or guild_id query param' })
    }

    if (req.method === 'DELETE') {
      const { code } = req.body
      if (!code) return res.status(400).json({ error: 'invite code required' })
      await revokeInviteViaMcp(accessToken, code)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const raw = err.message || 'Invite operation failed'
    const message = formatDiscordApiError(raw, err.code)
    const isRL = isRateLimitError(raw)
    const status = err.status || (isRL ? 429 : 500)
    const botInviteUrl =
      err.code === 'BOT_NOT_IN_GUILD' ? await botInviteForGuild(req.query?.guild_id) : undefined

    return res.status(status).json({
      error: isRL ? formatRateLimitError(raw) : message,
      code: err.code,
      botInviteUrl,
      details: err.details,
    })
  }
}
