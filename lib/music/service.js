import { LoadType } from 'shoukaku'
import { getShoukakuPlayer, requireMusicStack, unbindPlayer } from './bot.js'
import {
  clearSession,
  clearPlaybackError,
  enqueueTracks,
  ensureSession,

  getSession,
  serializeSession,
  setNowPlaying,
  setPaused,
  setPlaybackError,
  setPlaybackState,
  shiftQueue,
  removeTrack as removeQueueTrack,
  moveTrack as moveQueueTrack,
  clearQueue as clearQueueTracks,
  shuffleQueue as shuffleQueueTracks
} from './queue.js'
import { normalizeQuery, tracksFromLavalinkResult, extractYoutubeVideoId } from './resolve.js'
import { ensureVoicePlayer, getBotVoiceChannelId, getLavalinkPlaybackState, isVoiceConnected, playEncodedTrack } from './voice.js'
import { loadGuildState, saveGuildState } from './stateStore.js'
import { broadcastQueueUpdate, pushAction } from './sse.js'

async function emitUpdate(guildId, channelId) {
  const status = await getQueueStatus(guildId, channelId)
  broadcastQueueUpdate(guildId, channelId, status)
  return status
}

export function logMusicAction(guildId, channelId, actor, action, detail) {
  if (!actor) return
  pushAction(guildId, channelId, {
    userId: actor.userId || '',
    username: actor.username || 'user',
    action,
    detail,
  })
}

async function sessionMeta(guildId, channelId, connected) {
  const { shoukaku } = requireMusicStack()
  const botChannelId = getBotVoiceChannelId(shoukaku, guildId)
  const lavalink = await getLavalinkPlaybackState(guildId)

  // if connected, sync last channel id
  if (connected) {
      saveGuildState(guildId, { lastChannelId: channelId })
  }

  return serializeSession(guildId, channelId, connected, {
    botChannelId,
    channelMatch: !botChannelId || String(botChannelId) === String(channelId),
    lavalinkUdpConnected: lavalink.udpConnected,
    lavalinkHasTrack: lavalink.hasTrack,
    lavalinkPosition: lavalink.position,
  })
}

async function resolveQuery(query, requestedBy) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) {
    throw Object.assign(new Error('No Lavalink node available'), { status: 503, code: 'LAVALINK_OFFLINE' })
  }

  const identifier = normalizeQuery(query)

  // Bounded retries with jitter
  let result = null
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
      try {
          result = await node.rest.resolve(identifier)
          const failed = result?.loadType === LoadType.ERROR || result?.loadType === LoadType.EMPTY
          if (!failed) break
      } catch (err) {
          console.warn(`[resolve] Attempt ${attempts + 1} failed for ${identifier}: ${err.message}`)
      }

      attempts++
      if (attempts < maxAttempts) {
          const jitter = Math.random() * 500
          await new Promise(r => setTimeout(r, 500 + jitter))
      }
  }

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

async function handleAutoplay(guildId, channelId) {

    const state = loadGuildState(guildId)

    if (!state.autoplay) return false

    const lastPlayed = state.history?.[0] || state.recentlyPlayed?.[0]
    if (!lastPlayed) return false

    console.log(`[autoplay] attempting for guild=${guildId}`)
    const { shoukaku } = requireMusicStack()
    const node = shoukaku.getIdealNode()
    if (!node) return false

    setPlaybackState(guildId, channelId, 'joining')

    let result = null
    // try related if it's youtube
    if (lastPlayed.uri?.includes('youtube.com')) {
        const videoId = extractYoutubeVideoId(lastPlayed.uri)
        if (videoId) {
            try {
                // not all lavalink plugins support ytsearch related natively without a specific plugin like youtube-source
                // fallback to searching author + title
            } catch {
                // ignore
            }
        }
    }

    // fallback search
    if (!result || result.loadType === LoadType.ERROR || result.loadType === LoadType.EMPTY) {
        const fallbackQuery = `${lastPlayed.author} ${lastPlayed.title}`.replace(/[\[\(].*?[\]\)]/g, '').trim()
        try {
            result = await node.rest.resolve(`ytsearch:${fallbackQuery}`)
        } catch {
             console.warn(`[autoplay] search failed for ${fallbackQuery}`)
        }
    }

    if (result && result.loadType !== LoadType.ERROR && result.loadType !== LoadType.EMPTY) {
         const tracks = tracksFromLavalinkResult(result, 'autoplay')
         if (tracks.length > 0) {
             const trackToPlay = tracks[0]
             // Ensure we aren't looping the same track infinitely if fallback returns the same track
             if (trackToPlay.uri !== lastPlayed.uri) {
                console.log(`[autoplay] found track ${trackToPlay.title}`)
                const player = await ensureVoicePlayer(guildId, channelId, advanceQueue)
                setNowPlaying(guildId, channelId, trackToPlay)
                setPlaybackState(guildId, channelId, 'playing')
                await playEncodedTrack(player, trackToPlay.encoded)
                return true
             }
         }
    }

    setPlaybackState(guildId, channelId, 'idle')
    setPlaybackError(guildId, channelId, 'AUTOPLAY_NO_MATCH', 'Could not find a related track to autoplay.')
    return false
}

async function startPlaying(guildId, channelId, track) {
  clearPlaybackError(guildId, channelId)
  setPlaybackState(guildId, channelId, 'joining')
  const player = await ensureVoicePlayer(guildId, channelId, advanceQueue)
  setPlaybackState(guildId, channelId, 'playing')
  setNowPlaying(guildId, channelId, track)
  setPaused(guildId, channelId, false)
  await playEncodedTrack(player, track.encoded)
}

function failPlayback(guildId, channelId, reason) {
  const message =
    reason === 'loadFailed'
      ? 'Could not play that track. Try searching by song name instead of pasting the URL.'
      : 'Playback stopped unexpectedly.'
  setPlaybackError(guildId, channelId, 'TRACK_RESOLVE_FAILED', message)
  setPlaybackState(guildId, channelId, 'error')
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
    const autoplayHandled = await handleAutoplay(guildId, channelId)
    if (!autoplayHandled) {
        setPlaybackState(guildId, channelId, 'idle')
    }
    return
  }

  const player = getShoukakuPlayer(guildId)
  if (!player) {
      setPlaybackState(guildId, channelId, 'error')
      return
  }

  setNowPlaying(guildId, channelId, next)
  setPlaybackState(guildId, channelId, 'playing')
  await playEncodedTrack(player, next.encoded)
}

export async function joinVoice(guildId, channelId) {
  ensureSession(guildId, channelId)
  setPlaybackState(guildId, channelId, 'joining')

  try {
      await ensureVoicePlayer(guildId, channelId, advanceQueue)
      setPlaybackState(guildId, channelId, 'ready')
  } catch (e) {
      setPlaybackState(guildId, channelId, 'error')
      setPlaybackError(guildId, channelId, 'VOICE_JOIN_TIMEOUT', e.message)
      throw e
  }

  return await sessionMeta(guildId, channelId, true)
}

export async function playExistingTrack(guildId, channelId, track, requestedBy, prepend = false) {
  const session = ensureSession(guildId, channelId)
  const { shoukaku } = requireMusicStack()
  const hasPlayer = Boolean(shoukaku.players.get(guildId))
  const playTrack = { ...track, requestedBy: track.requestedBy || requestedBy }

  if (!session?.nowPlaying && !hasPlayer) {
    await startPlaying(guildId, channelId, playTrack)
  } else if (!session?.nowPlaying) {
    await startPlaying(guildId, channelId, playTrack)
  } else {
    enqueueTracks(guildId, channelId, [playTrack], prepend)
  }

  return emitUpdate(guildId, channelId)
}

export async function playQuery(guildId, channelId, query, requestedBy, prepend = false) {
  if (query) {
      saveGuildState(guildId, { lastQuery: query })
  }

  let tracks = []
  try {
      tracks = await resolveQuery(query, requestedBy)
  } catch (e) {
      setPlaybackError(guildId, channelId, 'TRACK_RESOLVE_FAILED', e.message)
      throw e
  }

  const session = ensureSession(guildId, channelId)
  const { shoukaku } = requireMusicStack()
  const hasPlayer = Boolean(shoukaku.players.get(guildId))

  if (!session?.nowPlaying && !hasPlayer) {
    await startPlaying(guildId, channelId, tracks[0])
    if (tracks.length > 1) enqueueTracks(guildId, channelId, tracks.slice(1), prepend)
  } else if (!session?.nowPlaying) {
    await startPlaying(guildId, channelId, tracks[0])
    if (tracks.length > 1) enqueueTracks(guildId, channelId, tracks.slice(1), prepend)
  } else {
    enqueueTracks(guildId, channelId, tracks, prepend)
    // if prepend is true and nothing is playing, the advanceQueue logic will pick it up
    // but if something IS playing, enqueueTracks prepended it.
  }

  return emitUpdate(guildId, channelId)
}

export async function playNext(guildId, channelId, query, requestedBy) {
    return playQuery(guildId, channelId, query, requestedBy, true)
}

export async function skipTrack(guildId, channelId) {
  const player = getShoukakuPlayer(guildId)
  const session = getSession(guildId, channelId)
  if (!player || !session) {
    throw Object.assign(new Error('Bot is not in a voice channel or no session'), { status: 400, code: 'NOT_IN_VOICE' })
  }

  // If paused, resume logic won't trigger next track automatically on stopTrack()
  // Actually stopTrack() triggers 'stopped' event, which we ignore in advanceQueue
  // Wait, in advanceQueue 'stopped' returns early. We need to manually advance.

  // To fix this and trigger advanceQueue, we can manually shift and play.
  // BUT player.stopTrack() triggers Lavalink's event which we catch.
  // Let's modify: we just do what advanceQueue does.

  const next = shiftQueue(guildId, channelId)
  if (!next) {
    setNowPlaying(guildId, channelId, null)
    setPlaybackState(guildId, channelId, 'idle')
    await player.stopTrack()
    return await sessionMeta(guildId, channelId, true)
  }

  setNowPlaying(guildId, channelId, next)
  setPlaybackState(guildId, channelId, 'playing')
  setPaused(guildId, channelId, false)
  await playEncodedTrack(player, next.encoded)
  return emitUpdate(guildId, channelId)
}

export async function togglePause(guildId, channelId) {
  const player = getShoukakuPlayer(guildId)
  const session = getSession(guildId, channelId)
  if (!player || !session) {
    throw Object.assign(new Error('Bot is not in a voice channel'), { status: 400, code: 'NOT_IN_VOICE' })
  }

  if (!session.nowPlaying) {
      return await sessionMeta(guildId, channelId, true)
  }

  const nextPaused = !player.paused
  await player.setPaused(nextPaused)
  setPaused(guildId, channelId, nextPaused)
  return emitUpdate(guildId, channelId)
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
  return sessionMeta(guildId, channelId, connected)
}

export async function removeTrack(guildId, channelId, index) {
    removeQueueTrack(guildId, channelId, index)
    return emitUpdate(guildId, channelId)
}

export async function moveTrack(guildId, channelId, fromIndex, toIndex) {
    moveQueueTrack(guildId, channelId, fromIndex, toIndex)
    return emitUpdate(guildId, channelId)
}

export async function clearQueue(guildId, channelId, keepNowPlaying) {
    clearQueueTracks(guildId, channelId, keepNowPlaying)
    return emitUpdate(guildId, channelId)
}

export async function shuffleQueue(guildId, channelId) {
    shuffleQueueTracks(guildId, channelId)
    return emitUpdate(guildId, channelId)
}

export async function setRepeatMode(guildId, channelId, mode) {
    saveGuildState(guildId, { repeat: mode })
    return emitUpdate(guildId, channelId)
}

export async function setAutoplay(guildId, channelId, enabled) {
    saveGuildState(guildId, { autoplay: enabled })
    return emitUpdate(guildId, channelId)
}
