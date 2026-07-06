export function getRequestOrigin(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '')
  }
  const proto = req.headers['x-forwarded-proto'] || 'http'
  let host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:5173'
  if (host === 'localhost:3001' || host.endsWith(':3001')) {
    host = `localhost:${process.env.VITE_DEV_PORT || '5173'}`
  }
  return `${proto}://${host}`
}

export async function getDiscordConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim()
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    throw Object.assign(
      new Error(
        'Discord OAuth is not configured. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to discord-mcp/.env.',
      ),
      { status: 503 },
    )
  }

  return { clientId, clientSecret }
}

export function getRedirectUri(req) {
  return process.env.DISCORD_REDIRECT_URI || `${getRequestOrigin(req)}/api/auth/callback`
}

export async function buildDiscordAuthUrl(req) {
  const { clientId } = await getDiscordConfig()
  const redirectUri = getRedirectUri(req)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
  })
  return `https://discord.com/api/oauth2/authorize?${params}`
}

export async function exchangeCodeForToken(code, redirectUri) {
  const { clientId, clientSecret } = await getDiscordConfig()
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const res = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const details = await res.text()
    throw Object.assign(new Error('Discord OAuth token exchange failed'), {
      status: 401,
      details,
    })
  }

  return res.json()
}

export async function refreshDiscordToken(refreshToken) {
  const { clientId, clientSecret } = await getDiscordConfig()
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const details = await res.text()
    throw Object.assign(new Error('Discord token refresh failed'), { status: 401, details })
  }

  return res.json()
}

export async function fetchDiscordUser(accessToken) {
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw Object.assign(new Error('Failed to fetch Discord user profile'), { status: 401 })
  }

  return res.json()
}

/** Guilds where the signed-in user can create channels */
export function filterManageableGuilds(guilds) {
  const MANAGE_CHANNELS = 16n
  const ADMINISTRATOR = 8n

  return guilds.filter((g) => {
    try {
      const perms = BigInt(g.permissions || '0')
      return (perms & ADMINISTRATOR) !== 0n || (perms & MANAGE_CHANNELS) !== 0n
    } catch {
      return true
    }
  })
}

export function isMissingPermissionsError(message = '') {
  return message.includes('50013') || message.includes('Missing Permissions')
}

export function formatDiscordApiError(message = '', code) {
  if (code === 'BOT_NOT_IN_GUILD') {
    return 'Goofy Discord bot is not in this server. Add the bot using the invite link below, then try again.'
  }
  if (code === 'BOT_NOT_CONFIGURED') {
    return 'Goofy Discord bot is not configured on the server.'
  }
  if (code === 'MISSING_USER_PERMISSION' || code === 'GUILD_NOT_ACCESSIBLE') {
    return message
  }
  if (message.includes('HTTP 401') || message.includes('401: Unauthorized')) {
    return 'Discord rejected the request — sign out and sign in again.'
  }
  if (isMissingPermissionsError(message)) {
    return 'You need Manage Channels or Administrator on this server. Pick a different server or ask an admin.'
  }
  if (message.includes('HTTP 403')) {
    return 'Missing permissions for this action on the selected server.'
  }
  if (message.includes('HTTP 429') || message.includes('rate limited')) {
    return 'Discord is rate limiting requests. Wait a few seconds and try again.'
  }
  return message
}

export { isRateLimitError, formatRateLimitError } from './discordRetry.js'
