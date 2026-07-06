import { loadDiscordMcpEnv } from './discordEnv.js'
import { withDiscordRetry } from './discordRetry.js'

const API_BASE = 'https://discord.com/api/v10'

export function getBotToken() {
  loadDiscordMcpEnv()
  const token = process.env.BOT_TOKEN?.trim()
  if (!token) {
    throw Object.assign(new Error('Goofy Discord bot is not configured on the server.'), {
      status: 503,
      code: 'BOT_NOT_CONFIGURED',
    })
  }
  return token.replace(/^Bot\s+/i, '').trim()
}

function isBotMissingFromGuild(status, body) {
  const text = String(body || '')
  return (
    status === 404 ||
    text.includes('50001') ||
    text.includes('Unknown Guild') ||
    text.includes('Missing Access')
  )
}

async function discordBotRequest(method, path, body) {
  const token = getBotToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  if (!res.ok) {
    if (isBotMissingFromGuild(res.status, text)) {
      throw Object.assign(
        new Error('Goofy Discord bot is not in this server. Add the bot using the invite link below, then try again.'),
        { status: 403, code: 'BOT_NOT_IN_GUILD', details: text },
      )
    }
    throw Object.assign(new Error(`HTTP ${res.status}: ${text}`), { status: res.status, details: text })
  }

  if (!text || res.status === 204) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function listGuildChannels(guildId) {
  return withDiscordRetry(() => discordBotRequest('GET', `/guilds/${guildId}/channels`))
}

export async function getChannel(channelId) {
  return withDiscordRetry(() => discordBotRequest('GET', `/channels/${channelId}`))
}

export async function updateChannel(channelId, updates) {
  const body = {}
  if (updates.name !== undefined) body.name = updates.name
  if (updates.topic !== undefined) body.topic = updates.topic
  if (updates.bitrate !== undefined) body.bitrate = updates.bitrate
  if (updates.user_limit !== undefined) body.user_limit = updates.user_limit
  if (updates.rtc_region !== undefined) body.rtc_region = updates.rtc_region
  if (updates.parent_id !== undefined) body.parent_id = updates.parent_id || null
  return withDiscordRetry(() => discordBotRequest('PATCH', `/channels/${channelId}`, body))
}

export async function deleteChannel(channelId) {
  return withDiscordRetry(() => discordBotRequest('DELETE', `/channels/${channelId}`))
}

export async function listGuildInvites(guildId) {
  return withDiscordRetry(() => discordBotRequest('GET', `/guilds/${guildId}/invites`))
}

export async function listChannelInvites(channelId) {
  return withDiscordRetry(() => discordBotRequest('GET', `/channels/${channelId}/invites`))
}

export async function revokeInvite(code) {
  return withDiscordRetry(() => discordBotRequest('DELETE', `/invites/${code}`))
}
