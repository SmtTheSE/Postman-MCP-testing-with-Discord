import { Constants } from 'shoukaku'
import { bindPlayerEnd, requireMusicStack, unbindPlayer } from './bot.js'

const { State } = Constants

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isVoiceConnected(shoukaku, guildId, channelId) {
  const conn = shoukaku.connections.get(guildId)
  return Boolean(conn && conn.state === State.CONNECTED && String(conn.channelId) === String(channelId))
}

export function getBotVoiceChannelId(shoukaku, guildId) {
  const conn = shoukaku.connections.get(guildId)
  return conn?.channelId || null
}

function lavalinkVoiceReady(player) {
  const voice = player?.voice
  return Boolean(voice?.endpoint && voice?.token && voice?.sessionId)
}

export async function getLavalinkPlaybackState(guildId) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) {
    return { udpConnected: false, hasTrack: false, position: 0 }
  }

  try {
    const player = await node.rest.getPlayer(guildId)
    return {
      udpConnected: player?.state?.connected === true || lavalinkVoiceReady(player),
      hasTrack: Boolean(player?.track),
      position: player?.state?.position ?? 0,
    }
  } catch {
    return { udpConnected: false, hasTrack: false, position: 0 }
  }
}

async function syncLavalinkVoice(node, shoukaku, guildId) {
  const conn = shoukaku.connections.get(guildId)
  if (!conn?.serverUpdate?.endpoint || !conn.sessionId || !conn.channelId) return false

  await node.rest.updatePlayer({
    guildId,
    playerOptions: {
      voice: {
        token: conn.serverUpdate.token,
        endpoint: conn.serverUpdate.endpoint,
        sessionId: conn.sessionId,
        channelId: String(conn.channelId),
      },
    },
  })
  return true
}

/** Lavalink player volume: 100 = normal, max 1000 */
const PLAYBACK_VOLUME = 100

async function waitForLavalinkVoice(node, shoukaku, guildId, timeoutMs = 20000) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const player = await node.rest.getPlayer(guildId)
    if (player?.state?.connected === true || lavalinkVoiceReady(player)) {
      return player
    }
    await sleep(300)
  }

  throw Object.assign(
    new Error(
      'Lavalink voice not ready. Ensure Lavalink 4.2+ is running (Discord requires DAVE encryption since March 2026).',
    ),
    { status: 504, code: 'LAVALINK_VOICE_TIMEOUT' },
  )
}

async function waitForDiscordVoice(shoukaku, guildId, channelId, timeoutMs = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (isVoiceConnected(shoukaku, guildId, channelId)) return
    await sleep(150)
  }
  throw Object.assign(new Error('Timed out connecting to the voice channel. Check bot Connect/Speak permissions.'), {
    status: 504,
    code: 'VOICE_CONNECT_TIMEOUT',
  })
}

/**
 * Join or move the bot to a voice channel and wait until Discord voice is ready.
 * @returns {import('shoukaku').Player}
 */
export async function ensureVoicePlayer(guildId, channelId, onEnd) {
  const { client, shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) {
    throw Object.assign(new Error('No Lavalink node available'), { status: 503, code: 'LAVALINK_OFFLINE' })
  }

  const conn = shoukaku.connections.get(guildId)
  const wrongChannel = conn?.channelId && String(conn.channelId) !== String(channelId)
  const disconnected = conn?.state === State.DISCONNECTED || conn?.state === State.DISCONNECTING

  if (wrongChannel || disconnected) {
    console.log(`[music] moving voice guild=${guildId} from=${conn?.channelId || 'none'} to=${channelId}`)
    await shoukaku.leaveVoiceChannel(guildId)
    unbindPlayer(guildId)
  }

  let activePlayer = shoukaku.players.get(guildId)
  if (!activePlayer || wrongChannel || disconnected) {
    console.log(`[music] joining voice guild=${guildId} channel=${channelId}`)
    const guild = client.guilds.cache.get(guildId)
    activePlayer = await shoukaku.joinVoiceChannel({
      guildId,
      channelId,
      shardId: guild?.shardId ?? 0,
      deaf: false,
      mute: false,
    })
    bindPlayerEnd(activePlayer, guildId, channelId, onEnd)
  }

  await waitForDiscordVoice(shoukaku, guildId, channelId)
  await syncLavalinkVoice(node, shoukaku, guildId)
  await sleep(500)
  console.log(`[music] voice ready guild=${guildId} channel=${channelId}`)
  return activePlayer
}

export async function playEncodedTrack(player, encoded) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) {
    throw Object.assign(new Error('No Lavalink node available'), { status: 503, code: 'LAVALINK_OFFLINE' })
  }

  await waitForLavalinkVoice(node, shoukaku, player.guildId)

  await player.playTrack({
    track: { encoded },
    volume: PLAYBACK_VOLUME,
    paused: false,
  })

  console.log(`[music] playing guild=${player.guildId}`)
}
