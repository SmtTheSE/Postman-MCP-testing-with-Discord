import { getMusicStatus } from './bot.js'
import { getSession as getQueueSession, sessionKey } from './queue.js'
import { getSubscriberCount } from './sse.js'

const counters = {
  tracksPlayed: 0,
  soundboardPlays: 0,
  djSpins: 0,
  lyricsFetches: 0,
}

/** @type {Map<string, number>} */
const mcpToolCalls = new Map()

export function incTracksPlayed() {
  counters.tracksPlayed += 1
}

export function incSoundboardPlays() {
  counters.soundboardPlays += 1
}

export function incDjSpins() {
  counters.djSpins += 1
}

export function incLyricsFetches() {
  counters.lyricsFetches += 1
}

export function incMcpToolCall(toolName) {
  const key = String(toolName || 'unknown')
  mcpToolCalls.set(key, (mcpToolCalls.get(key) || 0) + 1)
}

export function buildPrometheusMetrics() {
  const music = getMusicStatus()
  const mem = process.memoryUsage()
  const lines = [
    '# HELP goofy_up Goofy Discord API process is running',
    '# TYPE goofy_up gauge',
    'goofy_up 1',
    '# HELP goofy_music_bot_ready Music bot gateway ready',
    '# TYPE goofy_music_bot_ready gauge',
    `goofy_music_bot_ready ${music.bot ? 1 : 0}`,
    '# HELP goofy_lavalink_ready Lavalink node ready',
    '# TYPE goofy_lavalink_ready gauge',
    `goofy_lavalink_ready ${music.lavalink ? 1 : 0}`,
    '# HELP goofy_sse_connections Active SSE jukebox stream connections',
    '# TYPE goofy_sse_connections gauge',
    `goofy_sse_connections ${getSubscriberCount()}`,
    '# HELP goofy_tracks_played_total Total tracks started',
    '# TYPE goofy_tracks_played_total counter',
    `goofy_tracks_played_total ${counters.tracksPlayed}`,
    '# HELP goofy_soundboard_plays_total Soundboard clips played',
    '# TYPE goofy_soundboard_plays_total counter',
    `goofy_soundboard_plays_total ${counters.soundboardPlays}`,
    '# HELP goofy_dj_spins_total DJ roulette spins',
    '# TYPE goofy_dj_spins_total counter',
    `goofy_dj_spins_total ${counters.djSpins}`,
    '# HELP goofy_lyrics_fetches_total Lyrics API lookups',
    '# TYPE goofy_lyrics_fetches_total counter',
    `goofy_lyrics_fetches_total ${counters.lyricsFetches}`,
    '# HELP goofy_mcp_tool_calls_total MCP tool invocations by name',
    '# TYPE goofy_mcp_tool_calls_total counter',
    ...[...mcpToolCalls.entries()].map(([tool, n]) => `goofy_mcp_tool_calls_total{tool="${tool}"} ${n}`),
    '# HELP process_memory_bytes Node.js memory usage',
    '# TYPE process_memory_bytes gauge',
    `process_memory_bytes{type="rss"} ${mem.rss}`,
    `process_memory_bytes{type="heapUsed"} ${mem.heapUsed}`,
    '# HELP process_uptime_seconds Process uptime',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${Math.floor(process.uptime())}`,
  ]

  return `${lines.join('\n')}\n`
}
