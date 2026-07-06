import { loadDiscordMcpEnv } from '../lib/discordEnv.js'
import { getMusicStatus } from '../lib/music/bot.js'

export default async function handler(_req, res) {
  loadDiscordMcpEnv()
  const oauthReady = Boolean(
    process.env.DISCORD_CLIENT_ID?.trim() && process.env.DISCORD_CLIENT_SECRET?.trim(),
  )
  const music = getMusicStatus()
  res.status(200).json({
    status: 'ok',
    mcp: true,
    mode: 'user-oauth',
    oauth: oauthReady,
    music,
    timestamp: new Date().toISOString(),
  })
}
