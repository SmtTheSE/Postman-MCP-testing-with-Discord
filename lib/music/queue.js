/** In-memory jukebox queues keyed by guildId:channelId */

/** @typedef {{ encoded: string, title: string, author: string, length: number, uri?: string, requestedBy?: string }} QueueTrack */

/** @type {Map<string, { guildId: string, channelId: string, tracks: QueueTrack[], nowPlaying: QueueTrack | null, paused: boolean }>} */
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
    session = { guildId, channelId, tracks: [], nowPlaying: null, paused: false }
    sessions.set(key, session)
  }
  return session
}

/** @type {Map<string, string>} */
const playbackErrors = new Map()

export function setPlaybackError(guildId, channelId, message) {
  if (message) playbackErrors.set(sessionKey(guildId, channelId), message)
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

export function enqueueTracks(guildId, channelId, /** @type {QueueTrack[]} */ tracks) {
  const session = ensureSession(guildId, channelId)
  session.tracks.push(...tracks)
  return session
}

export function setNowPlaying(guildId, channelId, /** @type {QueueTrack | null} */ track) {
  const session = ensureSession(guildId, channelId)
  session.nowPlaying = track
  return session
}

export function shiftQueue(guildId, channelId) {
  const session = getSession(guildId, channelId)
  if (!session || !session.tracks.length) return null
  return session.tracks.shift()
}

export function setPaused(guildId, channelId, paused) {
  const session = ensureSession(guildId, channelId)
  session.paused = paused
  return session
}

export function serializeSession(guildId, channelId, connected = false, extra = {}) {
  const session = getSession(guildId, channelId)
  if (!session) {
    return { connected, nowPlaying: null, queue: [], paused: false, queueLength: 0, ...extra }
  }
  return {
    connected,
    nowPlaying: session.nowPlaying,
    queue: session.tracks,
    paused: session.paused,
    queueLength: session.tracks.length,
    ...extra,
  }
}
