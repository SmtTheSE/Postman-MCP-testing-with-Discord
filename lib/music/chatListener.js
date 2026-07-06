import { playQuery } from './service.js'

let pollingInterval = null
const seenMessages = new Set()

export function startChatPolling() {
    if (pollingInterval) return

    // Using dynamic import to avoid circular dependencies if needed
    // But we need a way to run the MCP tool. We have mcpRunner.js

    pollingInterval = setInterval(async () => {
        try {
            const { runWithBotToken } = await import('../mcpRunner.js')


            // In a real scenario we'd query which guilds have announceChannelId set
            // For MVP, we'd need a list of active sessions or guilds
            // Let's iterate over active sessions or just all loaded states that have announceChannelId

            const fs = await import('fs')
            const path = await import('path')

            const dataDir = path.resolve(process.cwd(), 'server/data/jukebox')
            if (!fs.existsSync(dataDir)) return

            const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
            for (const file of files) {
                const guildId = file.replace('.json', '')
                const stateStr = fs.readFileSync(path.join(dataDir, file), 'utf8')
                let state = null
                try { state = JSON.parse(stateStr) } catch (_e) { continue }

                if (state.announceChannelId) {
                    const channelId = state.announceChannelId

                    // Use MCP to fetch messages
                    const messages = await runWithBotToken(async () => {
                        const { apiTool } = await import('../../discord-mcp/tools/pan-mcp/discord-rest-api/get-channel-messages.js')
                        return apiTool.function({ channel_id: channelId, limit: 10, __auth_token: process.env.__MCP_AUTH_TOKEN })
                    })

                    if (Array.isArray(messages)) {
                        for (const msg of messages) {
                            if (seenMessages.has(msg.id)) continue
                            seenMessages.add(msg.id)

                            // Check if message is a command
                            if (msg.content && msg.content.toLowerCase().startsWith('!play ')) {
                                const query = msg.content.substring(6).trim()
                                if (query) {
                                    const requestedBy = msg.author?.username || 'Chat User'
                                    // Queue track
                                    // NOTE: We need the VC channelId where the bot is connected.
                                    // We can get this from the session or bot state

                                    /* player not needed just ensures imported */
                                    // if bot is not in a VC, we can't easily join unless we know which VC to join.
                                    // We'll require the bot to be already in a VC for chat requests to work.

                                    // Check active sessions
                                    const { getSessionsForGuild } = await import('./queue.js')
                                    const activeChannelId = getSessionsForGuild(guildId)?.[0] // MVP assumption

                                    if (activeChannelId) {
                                        await playQuery(guildId, activeChannelId, query, requestedBy, false)
                                        const { pushAction } = await import('./sse.js')
                                        pushAction(guildId, activeChannelId, { userId: msg.author.id, username: requestedBy, action: 'added_via_chat', detail: query })

                                        // Educational Comment:
                                        /*
                                         * ==========================================
                                         * EDUCATIONAL NOTE (Postman MCP expansion)
                                         * ==========================================
                                         * In a production Discord bot, you would use standard Discord Gateway
                                         * events (like \`messageCreate\`) to instantly listen for chat commands.
                                         *
                                         * However, this project demonstrates how to use Postman MCP Tools
                                         * (Model Context Protocol). Here, we are periodically polling the
                                         * \`get_channel_messages\` MCP tool REST equivalent to fetch chat history
                                         * and act upon it. This proves out the MCP-to-REST integration pattern!
                                         * ==========================================
                                         */
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore errors for polling
            // console.error(e)
        }
    }, 10000)
}
