import { runWithUserToken } from './mcpRunner.js'
import { withDiscordRetry } from './discordRetry.js'

export async function getGuildViaMcp(accessToken, guildId) {
  return runWithUserToken(accessToken, () =>
    withDiscordRetry(async () => {
      const { apiTool } = await import(
        '../discord-mcp/tools/pan-mcp/discord-rest-api/get-guild.js'
      )
      return apiTool.function({ guild_id: guildId, with_counts: true })
    }),
  )
}
