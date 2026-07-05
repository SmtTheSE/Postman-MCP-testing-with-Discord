import { loadDiscordMcpEnv } from './discordEnv.js'
import { withDiscordRetry } from './discordRetry.js'

/** Run a Postman MCP tool with a Discord user OAuth bearer token */
export async function runWithUserToken(accessToken, fn) {
  loadDiscordMcpEnv()

  const prevApiKey = process.env.pan_mcp_api_key
  const prevAuthToken = process.env.__MCP_AUTH_TOKEN
  const bearer = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
  const rawToken = bearer.replace(/^Bearer\s+/i, '')

  process.env.pan_mcp_api_key = bearer
  process.env.__MCP_AUTH_TOKEN = rawToken

  try {
    return await fn()
  } finally {
    if (prevApiKey !== undefined) process.env.pan_mcp_api_key = prevApiKey
    else delete process.env.pan_mcp_api_key
    if (prevAuthToken) process.env.__MCP_AUTH_TOKEN = prevAuthToken
    else delete process.env.__MCP_AUTH_TOKEN
  }
}

/** list_my_guilds MCP tool — requires user OAuth token */
export async function listGuildsViaMcp(accessToken) {
  return runWithUserToken(accessToken, () =>
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
