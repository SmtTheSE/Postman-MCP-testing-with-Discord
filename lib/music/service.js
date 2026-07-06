import { LoadType } from 'shoukaku'
import { getShoukakuPlayer, requireMusicStack, unbindPlayer } from './bot.js'
import {
  clearSession,
  clearPlaybackError,
  enqueueTracks,
  ensureSession,
  getPlaybackError,
  getSession,
  serializeSession,
  setNowPlaying,
  setPaused,
  setPlaybackError,
  shiftQueue,
} from './queue.js'
import { normalizeQuery, tracksFromLavalinkResult, extractYoutubeVideoId } from './resolve.js'
import { ensureVoicePlayer, getBotVoiceChannelId, getLavalinkPlaybackState, isVoiceConnected, playEncodedTrack } from './voice.js'

async function sessionMeta(guildId, channelId, connected) {
  const { shoukaku } = requireMusicStack()
  const botChannelId = getBotVoiceChannelId(shoukaku, guildId)
  const lavalink = await getLavalinkPlaybackState(guildId)
  return serializeSession(guildId, channelId, connected, {
    botChannelId,
    channelMatch: !botChannelId || String(botChannelId) === String(channelId),
    lavalinkUdpConnected: lavalink.udpConnected,
    lavalinkHasTrack: lavalink.hasTrack,
    lavalinkPosition: lavalink.position,
    playbackError: getPlaybackError(guildId, channelId),
  })
}

async function resolveQuery(query, requestedBy) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) {
    throw Object.assign(new Error('No Lavalink node available'), { status: 503, code: 'LAVALINK_OFFLINE' })
  }

  const identifier = normalizeQuery(query)
  let result = await node.rest.resolve(identifier)

  const failed = result?.loadType === LoadType.ERROR || result?.loadType === LoadType.EMPTY
  const videoId = extractYoutubeVideoId(query)

  if (failed && videoId && identifier !== videoId) {
    result = await node.rest.resolve(videoId)
  }

  let stillFailed = result?.loadType === LoadType.ERROR || result?.loadType === LoadType.EMPTY
  if (stillFailed && videoId) {
    result = await node.rest.resolve(`ytsearch:${videoId}`)
    stillFailed = result?.loadType === LoadType.ERROR || result?.loadType === LoadType.EMPTY
  }
  if (stillFailed) {
    const fallback = String(query || '').trim()
    if (fallback && !fallback.startsWith('ytsearch:')) {
      result = await node.rest.resolve(`ytsearch:${fallback}`)
    }
  }

  return tracksFromLavalinkResult(result, requestedBy)
}

async function startPlaying(guildId, channelId, track) {
  clearPlaybackError(guildId, channelId)
  const player = await ensureVoicePlayer(guildId, channelId, advanceQueue)
  setNowPlaying(guildId, channelId, track)
  setPaused(guildId, channelId, false)
  await playEncodedTrack(player, track.encoded)
}

function failPlayback(guildId, channelId, reason) {
  const message =
    reason === 'loadFailed'
      ? 'Could not play that track. Try searching by song name instead of pasting the URL.'
      : 'Playback stopped unexpectedly.'
  setPlaybackError(guildId, channelId, message)
  setNowPlaying(guildId, channelId, null)
}

async function advanceQueue(guildId, channelId, reason) {
  console.log(`[music] track ended guild=${guildId} reason=${reason}`)
  if (reason === 'replaced' || reason === 'stopped') return

  if (reason === 'cleanup' || reason === 'loadFailed') {
    failPlayback(guildId, channelId, reason)
    return
  }

  const next = shiftQueue(guildId, channelId)
  if (!next) {
    setNowPlaying(guildId, channelId, null)
    return
  }

  const player = getShoukakuPlayer(guildId)
  if (!player) return

  setNowPlaying(guildId, channelId, next)
  await playEncodedTrack(player, next.encoded)
}

export async function joinVoice(guildId, channelId) {
  ensureSession(guildId, channelId)
  await ensureVoicePlayer(guildId, channelId, advanceQueue)
  return await sessionMeta(guildId, channelId, true)
}

export async function playQuery(guildId, channelId, query, requestedBy) {
  const tracks = await resolveQuery(query, requestedBy)
  const session = getSession(guildId, channelId)
  const { shoukaku } = requireMusicStack()
  const hasPlayer = Boolean(shoukaku.players.get(guildId))

  if (!session?.nowPlaying && !hasPlayer) {
    await startPlaying(guildId, channelId, tracks[0])
    if (tracks.length > 1) enqueueTracks(guildId, channelId, tracks.slice(1))
  } else if (!session?.nowPlaying) {
    await startPlaying(guildId, channelId, tracks[0])
    if (tracks.length > 1) enqueueTracks(guildId, channelId, tracks.slice(1))
  } else {
    enqueueTracks(guildId, channelId, tracks)
  }

  return await sessionMeta(guildId, channelId, isVoiceConnected(shoukaku, guildId, channelId))
}

export async function skipTrack(guildId, channelId) {
  const player = getShoukakuPlayer(guildId)
  if (!player) {
    throw Object.assign(new Error('Bot is not in a voice channel'), { status: 400, code: 'NOT_IN_VOICE' })
  }

  const next = shiftQueue(guildId, channelId)
  if (!next) {
    setNowPlaying(guildId, channelId, null)
    await player.stopTrack()
    return await sessionMeta(guildId, channelId, true)
  }

  setNowPlaying(guildId, channelId, next)
  await playEncodedTrack(player, next.encoded)
  return await sessionMeta(guildId, channelId, true)
}

export async function togglePause(guildId, channelId) {
  const player = getShoukakuPlayer(guildId)
  if (!player) {
    throw Object.assign(new Error('Bot is not in a voice channel'), { status: 400, code: 'NOT_IN_VOICE' })
  }

  const nextPaused = !player.paused
  await player.setPaused(nextPaused)
  setPaused(guildId, channelId, nextPaused)
  return await sessionMeta(guildId, channelId, true)
}

export async function leaveVoice(guildId, channelId) {
  const { shoukaku } = requireMusicStack()
  await shoukaku.leaveVoiceChannel(guildId)
  clearSession(guildId, channelId)
  unbindPlayer(guildId)
  return { success: true }
}

export async function getQueueStatus(guildId, channelId) {
  const { shoukaku } = requireMusicStack()
  const connected = isVoiceConnected(shoukaku, guildId, channelId)
  return await sessionMeta(guildId, channelId, connected)
}
