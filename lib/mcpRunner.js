import { loadDiscordMcpEnv } from './discordEnv.js'
import { withDiscordRetry } from './discordRetry.js'

/** Run a Postman MCP tool with a Discord user OAuth bearer token */
export async function runWithUserToken(accessToken, fn) {
  loadDiscordMcpEnv()

  const rawToken = String(accessToken).replace(/^Bearer\s+/i, '').trim()
  if (!rawToken) {
    throw Object.assign(new Error('Missing Discord access token'), { status: 401 })
  }

  const prev = {
    apiKey: process.env.pan_mcp_api_key,
    authToken: process.env.__MCP_AUTH_TOKEN,
  }

  // User OAuth only — pan_mcp_api_key drives the actual auth header
  process.env.__MCP_AUTH_TOKEN = rawToken
  process.env.pan_mcp_api_key = rawToken

  try {
    return await fn({ __auth_token: rawToken })
  } finally {
    if (prev.apiKey !== undefined) process.env.pan_mcp_api_key = prev.apiKey
    else delete process.env.pan_mcp_api_key
    if (prev.authToken) process.env.__MCP_AUTH_TOKEN = prev.authToken
    else delete process.env.__MCP_AUTH_TOKEN
    if (prev.botToken !== undefined) process.env.BOT_TOKEN = prev.botToken
    if (prev.userToken !== undefined) process.env.USER_TOKEN = prev.userToken
  }
}

/** Run a Postman MCP tool with the server bot token (guild channel operations) */
export async function runWithBotToken(fn) {
  loadDiscordMcpEnv()

  const rawToken = String(process.env.BOT_TOKEN || '')
    .replace(/^Bot\s+/i, '')
    .trim()
  if (!rawToken) {
    throw Object.assign(new Error('Goofy Discord bot is not configured on the server.'), {
      status: 503,
      code: 'BOT_NOT_CONFIGURED',
    })
  }

  const prev = {
    apiKey: process.env.pan_mcp_api_key,
    authToken: process.env.__MCP_AUTH_TOKEN,
    botToken: process.env.BOT_TOKEN,
  }

  delete process.env.__MCP_AUTH_TOKEN
  process.env.pan_mcp_api_key = `Bot ${rawToken}`
  process.env.BOT_TOKEN = rawToken

  try {
    return await fn()
  } finally {
    if (prev.authToken) process.env.__MCP_AUTH_TOKEN = prev.authToken
    else delete process.env.__MCP_AUTH_TOKEN
    if (prev.apiKey !== undefined) process.env.pan_mcp_api_key = prev.apiKey
    else delete process.env.pan_mcp_api_key
    if (prev.botToken !== undefined) process.env.BOT_TOKEN = prev.botToken
  }
}

export async function listGuildsViaMcp(accessToken) {
  return runWithUserToken(accessToken, async () =>
    withDiscordRetry(async () => {
      const { apiTool } = await import(
        '../discord-mcp/tools/pan-mcp/discord-rest-api/list-my-guilds.js'
      )
      const result = await apiTool.function({ limit: 200, with_counts: true })
      return Array.isArray(result) ? result : []
    }),
  )
}

/** get_my_oauth2_authorization MCP tool — validates user OAuth token */
export async function getOAuthAuthorizationViaMcp(accessToken) {
  return runWithUserToken(accessToken, async () => {
    const { apiTool } = await import(
      '../discord-mcp/tools/pan-mcp/discord-rest-api/get-my-oauth-2-authorization.js'
    )
    return apiTool.function({})
  })
}
