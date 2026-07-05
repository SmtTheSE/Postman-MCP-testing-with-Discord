import { loadDiscordMcpEnv } from '../lib/discordEnv.js'

export default async function handler(_req, res) {
  loadDiscordMcpEnv()
  const oauthReady = Boolean(
    process.env.DISCORD_CLIENT_ID?.trim() && process.env.DISCORD_CLIENT_SECRET?.trim(),
  )
  res.status(200).json({
    status: 'ok',
    mcp: true,
    mode: 'user-oauth',
    oauth: oauthReady,
    timestamp: new Date().toISOString(),
  })
}
