import { getRequestOrigin, getDiscordConfig } from '../../lib/discordOAuth.js'
import { loadDiscordMcpEnv } from '../../lib/discordEnv.js'
import { buildBotInviteUrl } from '../../lib/botInvite.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  loadDiscordMcpEnv()

  const hasSecret = Boolean(process.env.DISCORD_CLIENT_SECRET?.trim())
  const hasClientId = Boolean(process.env.DISCORD_CLIENT_ID?.trim())
  const botConfigured = Boolean(process.env.BOT_TOKEN?.trim())
  const redirectUri = `${getRequestOrigin(req)}/api/auth/callback`
  const ready = hasSecret && hasClientId && botConfigured

  let message = null
  if (!hasSecret) message = 'Add DISCORD_CLIENT_SECRET to discord-mcp/.env (OAuth2 tab in Developer Portal).'
  else if (!hasClientId) message = 'DISCORD_CLIENT_ID is missing in discord-mcp/.env.'
  else if (!botConfigured) message = 'Add BOT_TOKEN to discord-mcp/.env so Goofy Discord can manage channels.'

  let botInviteUrl = null
  if (hasClientId) {
    try {
      const { clientId } = await getDiscordConfig()
      botInviteUrl = buildBotInviteUrl(clientId)
    } catch {
      botInviteUrl = null
    }
  }

  res.status(200).json({
    ready,
    bot: botConfigured,
    oauth: hasSecret,
    clientId: hasClientId,
    redirectUri,
    botInviteUrl,
    message,
  })
}
