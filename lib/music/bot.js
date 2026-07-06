/**
 * Music bot: discord.js Gateway + Shoukaku → Lavalink v4
 *
 * Dev: run Lavalink locally (default localhost:2333, password youshallnotpass)
 * Env: BOT_TOKEN, LAVALINK_HOST, LAVALINK_PASSWORD in discord-mcp/.env
 */
import { Client, GatewayIntentBits } from 'discord.js'
import { Shoukaku, Connectors } from 'shoukaku'
import { loadDiscordMcpEnv } from '../discordEnv.js'
import { setNowPlaying, setPlaybackError } from './queue.js'

/** @type {Client | null} */
let client = null
/** @type {Shoukaku | null} */
let shoukaku = null
/** @type {Promise<void> | null} */
let startPromise = null

let botReady = false
let lavalinkReady = false

/** @type {Set<string>} */
const boundPlayers = new Set()

export function getMusicStatus() {
  return {
    bot: botReady,
    lavalink: lavalinkReady,
    ready: botReady && lavalinkReady,
  }
}

export async function startMusicBot() {
  if (startPromise) return startPromise
  startPromise = _startMusicBot()
  return startPromise
}

async function _startMusicBot() {
  loadDiscordMcpEnv()
  const token = process.env.BOT_TOKEN?.trim()
  if (!token) {
    console.warn('[music] BOT_TOKEN missing — jukebox API disabled')
    return
  }

  const host = process.env.LAVALINK_HOST?.trim() || 'localhost:2333'
  const password = process.env.LAVALINK_PASSWORD?.trim() || 'youshallnotpass'

  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  })

  shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [
    { name: 'main', url: host, auth: password },
  ], {
    voiceConnectionTimeout: 30000,
    resumeByLibrary: false,
  })

  shoukaku.on('ready', (name) => {
    lavalinkReady = true
    console.log(`[music] Lavalink node ready (${name})`)
  })

  shoukaku.on('debug', (_name, message) => {
    if (process.env.MUSIC_DEBUG === '1' && (message.includes('[Voice]') || message.includes('Player'))) {
      console.log(`[music:debug] ${message}`)
    }
  })

  shoukaku.on('close', () => {
    lavalinkReady = false
  })

  shoukaku.on('error', (name, err) => {
    lavalinkReady = false
    console.error(`[music] Lavalink error (${name}):`, err.message)
  })

  await client.login(token)

  await new Promise((resolve, reject) => {
    if (client.isReady()) {
      botReady = true
      resolve()
      return
    }
    client.once('ready', () => {
      botReady = true
      resolve()
    })
    setTimeout(() => reject(new Error('Discord gateway ready timeout')), 20000)
  })

  console.log(`[music] Gateway ready as ${client.user?.tag}`)

  const { attachAutoLeave } = await import('./autoLeave.js')
  attachAutoLeave(client)
}

export function requireMusicStack() {
  if (!process.env.BOT_TOKEN?.trim()) {
    throw Object.assign(new Error('Music bot is not configured (BOT_TOKEN missing)'), {
      status: 503,
      code: 'BOT_NOT_CONFIGURED',
    })
  }
  if (!client || !shoukaku) {
    throw Object.assign(new Error('Music bot is still starting — try again in a few seconds'), {
      status: 503,
      code: 'BOT_STARTING',
    })
  }
  if (!botReady) {
    throw Object.assign(new Error('Music bot is not connected to Discord Gateway'), {
      status: 503,
      code: 'BOT_OFFLINE',
    })
  }
  if (!lavalinkReady) {
    throw Object.assign(
      new Error('Lavalink is offline. Start Lavalink (see server/lavalink.application.yml.example).'),
      { status: 503, code: 'LAVALINK_OFFLINE' },
    )
  }
  return { client, shoukaku }
}

export function getShoukakuPlayer(guildId) {
  const { shoukaku } = requireMusicStack()
  return shoukaku.players.get(guildId) || null
}

/**
 * @param {import('shoukaku').Player} player
 * @param {string} guildId
 * @param {(guildId: string, channelId: string, reason: string) => Promise<void>} onEnd
 */
export function bindPlayerEnd(player, guildId, channelId, onEnd) {
  if (boundPlayers.has(guildId)) return
  boundPlayers.add(guildId)
  player.on('end', (data) => {
    onEnd(guildId, channelId, data.reason).catch((err) => {
      console.error('[music] queue advance failed:', err.message)
    })
  })
  player.on('start', () => {
    console.log(`[music] track started guild=${guildId}`)
  })
  player.on('closed', (data) => {
    const code = data?.code
    // 4017 = Discord requires DAVE/E2EE; fixed by Lavalink 4.2+
    if (code === 4017) {
      console.warn(`[music] voice ws closed 4017 (DAVE) guild=${guildId} — upgrade Lavalink to 4.2+`)
      return
    }
    console.error(`[music] voice websocket closed guild=${guildId}`, code)
  })
  player.on('update', () => {
    // Lavalink fires player updates frequently during playback — avoid log spam
  })
  player.on('exception', (data) => {
    const msg = data.exception?.message || 'unknown'
    console.error('[music] playback exception:', msg)
    const friendly = msg.toLowerCase().includes('all clients failed')
      ? 'YouTube blocked that link. Try searching by song name instead of pasting the URL.'
      : 'Playback failed for that track.'
    setPlaybackError(guildId, channelId, friendly)
    setNowPlaying(guildId, channelId, null)
  })
  player.on('stuck', (data) => {
    console.error('[music] track stuck:', data.thresholdMs)
  })
}

export function unbindPlayer(guildId) {
  boundPlayers.delete(guildId)
}
