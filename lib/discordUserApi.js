import { withDiscordRetry } from './discordRetry.js'

const API_BASE = 'https://discord.com/api/v10'

function bearerToken(accessToken) {
  return String(accessToken).replace(/^Bearer\s+/i, '').trim()
}

async function discordUserRequest(accessToken, method, path, body) {
  const token = bearerToken(accessToken)
  if (!token) {
    throw Object.assign(new Error('Missing Discord access token'), { status: 401 })
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  if (!res.ok) {
    throw Object.assign(new Error(`HTTP ${res.status}: ${text}`), { status: res.status })
  }

  if (!text || res.status === 204) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function listGuildChannels(accessToken, guildId) {
  return withDiscordRetry(() => discordUserRequest(accessToken, 'GET', `/guilds/${guildId}/channels`))
}

export async function getChannel(accessToken, channelId) {
  return withDiscordRetry(() => discordUserRequest(accessToken, 'GET', `/channels/${channelId}`))
}

export async function updateChannel(accessToken, channelId, updates) {
  const body = {}
  if (updates.name !== undefined) body.name = updates.name
  if (updates.topic !== undefined) body.topic = updates.topic
  if (updates.bitrate !== undefined) body.bitrate = updates.bitrate
  if (updates.user_limit !== undefined) body.user_limit = updates.user_limit
  if (updates.rtc_region !== undefined) body.rtc_region = updates.rtc_region
  if (updates.parent_id !== undefined) body.parent_id = updates.parent_id || null
  return withDiscordRetry(() => discordUserRequest(accessToken, 'PATCH', `/channels/${channelId}`, body))
}

export async function deleteChannel(accessToken, channelId) {
  return withDiscordRetry(() => discordUserRequest(accessToken, 'DELETE', `/channels/${channelId}`))
}

export async function listGuildInvites(accessToken, guildId) {
  return withDiscordRetry(() => discordUserRequest(accessToken, 'GET', `/guilds/${guildId}/invites`))
}

export async function listChannelInvites(accessToken, channelId) {
  return withDiscordRetry(() => discordUserRequest(accessToken, 'GET', `/channels/${channelId}/invites`))
}

export async function revokeInvite(accessToken, code) {
  return withDiscordRetry(() => discordUserRequest(accessToken, 'DELETE', `/invites/${code}`))
}

/** Quick validation that a user access token is still accepted by Discord. */
export async function validateUserToken(accessToken) {
  return discordUserRequest(accessToken, 'GET', '/users/@me')
}
