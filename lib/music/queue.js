import { loadGuildState, addRecentlyPlayed } from './stateStore.js'

/** In-memory jukebox queues keyed by guildId:channelId */

/** @typedef {{ encoded: string, title: string, author: string, length: number, uri?: string, requestedBy?: string }} QueueTrack */

/** @type {Map<string, { guildId: string, channelId: string, tracks: QueueTrack[], nowPlaying: QueueTrack | null, paused: boolean, state: 'idle' | 'joining' | 'ready' | 'playing' | 'paused' | 'error' }>} */
const sessions = new Map()

export function sessionKey(guildId, channelId) {
  return `${guildId}:${channelId}`
}

export function getSession(guildId, channelId) {
  const key = sessionKey(guildId, channelId)
  return sessions.get(key) || null
}

export function ensureSession(guildId, channelId) {
  const key = sessionKey(guildId, channelId)
  let session = sessions.get(key)
  if (!session) {
    session = { guildId, channelId, tracks: [], nowPlaying: null, paused: false, state: 'idle' }
    sessions.set(key, session)
  }
  return session
}

/** @type {Map<string, { code: string, message: string } | null>} */
const playbackErrors = new Map()

export function setPlaybackError(guildId, channelId, code, message) {
  if (message) playbackErrors.set(sessionKey(guildId, channelId), { code, message })
}

export function clearPlaybackError(guildId, channelId) {
  playbackErrors.delete(sessionKey(guildId, channelId))
}

export function getPlaybackError(guildId, channelId) {
  return playbackErrors.get(sessionKey(guildId, channelId)) || null
}

export function clearSession(guildId, channelId) {
  playbackErrors.delete(sessionKey(guildId, channelId))
  sessions.delete(sessionKey(guildId, channelId))
}

export function enqueueTracks(guildId, channelId, /** @type {QueueTrack[]} */ tracks, prepend = false) {
  const session = ensureSession(guildId, channelId)
  if (prepend) {
      session.tracks.unshift(...tracks)
  } else {
      session.tracks.push(...tracks)
  }
  return session
}

export function setNowPlaying(guildId, channelId, /** @type {QueueTrack | null} */ track) {
  const session = ensureSession(guildId, channelId)
  session.nowPlaying = track
  if (track) {
    addRecentlyPlayed(guildId, track)
  }
  return session
}

export function shiftQueue(guildId, channelId) {
  const session = getSession(guildId, channelId)
  if (!session) return null

  const state = loadGuildState(guildId)

  if (state.repeat === 'track' && session.nowPlaying) {
      return session.nowPlaying
  }

  if (state.repeat === 'queue' && session.nowPlaying) {
      session.tracks.push(session.nowPlaying)
  }

  if (!session.tracks.length) return null
  return session.tracks.shift()
}

export function setPaused(guildId, channelId, paused) {
  const session = ensureSession(guildId, channelId)
  session.paused = paused
  session.state = paused ? 'paused' : (session.nowPlaying ? 'playing' : 'idle')
  return session
}

export function setPlaybackState(guildId, channelId, stateStr) {
    const session = ensureSession(guildId, channelId)
    session.state = stateStr
    return session
}

export function serializeSession(guildId, channelId, connected = false, extra = {}) {
  const session = getSession(guildId, channelId)
  const storeState = loadGuildState(guildId)
  const playbackErrorObj = getPlaybackError(guildId, channelId)

  // Convert old string playbackError to object or use the object directly
  let playbackError = null
  let playbackErrorCode = null
  if (playbackErrorObj) {
      playbackError = playbackErrorObj.message || playbackErrorObj
      playbackErrorCode = playbackErrorObj.code || 'UNKNOWN_ERROR'
  }

  const baseState = {
    connected,
    nowPlaying: null,
    queue: [],
    paused: false,
    queueLength: 0,
    state: 'idle',
    settings: {
        repeat: storeState.repeat,
        autoplay: storeState.autoplay,
    },
    playbackError,
    playbackErrorCode,
    ...extra
  }

  if (!session) {
    return baseState
  }

  return {
    ...baseState,
    nowPlaying: session.nowPlaying,
    queue: session.tracks,
    paused: session.paused,
    queueLength: session.tracks.length,
    state: session.state,
  }
}

export function removeTrack(guildId, channelId, index) {
    const session = ensureSession(guildId, channelId)
    if (index >= 0 && index < session.tracks.length) {
        session.tracks.splice(index, 1)
    }
    return session
}

export function moveTrack(guildId, channelId, fromIndex, toIndex) {
    const session = ensureSession(guildId, channelId)
    if (fromIndex >= 0 && fromIndex < session.tracks.length && toIndex >= 0 && toIndex < session.tracks.length) {
        const [track] = session.tracks.splice(fromIndex, 1)
        session.tracks.splice(toIndex, 0, track)
    }
    return session
}

export function clearQueue(guildId, channelId, keepNowPlaying) {
    const session = ensureSession(guildId, channelId)
    session.tracks = []
    if (!keepNowPlaying) {
        session.nowPlaying = null
    }
    return session
}

export function shuffleQueue(guildId, channelId) {
    const session = ensureSession(guildId, channelId)
    for (let i = session.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [session.tracks[i], session.tracks[j]] = [session.tracks[j], session.tracks[i]];
    }
    return session
}
