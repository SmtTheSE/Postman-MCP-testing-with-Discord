import { getRequestOrigin } from '../../lib/discordOAuth.js'
import { loadDiscordMcpEnv } from '../../lib/discordEnv.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  loadDiscordMcpEnv()

  const hasSecret = Boolean(process.env.DISCORD_CLIENT_SECRET?.trim())
  const hasClientId = Boolean(process.env.DISCORD_CLIENT_ID?.trim())
  const redirectUri = `${getRequestOrigin(req)}/api/auth/callback`
  const ready = hasSecret && hasClientId

  let message = null
  if (!hasSecret) message = 'Add DISCORD_CLIENT_SECRET to discord-mcp/.env (OAuth2 tab in Developer Portal).'
  else if (!hasClientId) message = 'DISCORD_CLIENT_ID is missing in discord-mcp/.env.'

  res.status(200).json({
    ready,
    bot: false,
    oauth: hasSecret,
    clientId: hasClientId,
    redirectUri,
    message,
  })
}