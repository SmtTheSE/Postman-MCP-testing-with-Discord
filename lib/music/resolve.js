import { LoadType } from 'shoukaku'

const YT_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/

/**
 * @param {string} input
 * @returns {string | null}
 */
export function extractYoutubeVideoId(input) {
  const raw = String(input || '').trim()
  if (!raw) return null

  if (YT_VIDEO_ID.test(raw)) return raw

  let url
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && YT_VIDEO_ID.test(id) ? id : null
  }

  if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'm.youtube.com') {
    const v = url.searchParams.get('v')
    if (v && YT_VIDEO_ID.test(v)) return v

    const parts = url.pathname.split('/').filter(Boolean)
    const shortsIdx = parts.indexOf('shorts')
    if (shortsIdx >= 0 && parts[shortsIdx + 1] && YT_VIDEO_ID.test(parts[shortsIdx + 1])) {
      return parts[shortsIdx + 1]
    }

    const embedIdx = parts.indexOf('embed')
    if (embedIdx >= 0 && parts[embedIdx + 1] && YT_VIDEO_ID.test(parts[embedIdx + 1])) {
      return parts[embedIdx + 1]
    }
  }

  return null
}

export function normalizeQuery(query) {
  const q = String(query || '').trim()
  if (!q) {
    throw Object.assign(new Error('Search query or URL is required'), { status: 400, code: 'INVALID_QUERY' })
  }

  const videoId = extractYoutubeVideoId(q)
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`
  }

  if (/^https?:\/\//i.test(q)) return q.split(/\s/)[0]
  return `ytsearch:${q}`
}

function friendlyLoadError(data) {
  const raw = [data?.message, data?.cause].filter(Boolean).join(' — ')
  const lower = raw.toLowerCase()

  if (lower.includes('scriptextraction') || lower.includes('sig function') || lower.includes('cannot be loaded')) {
    return 'YouTube blocked that link. Try searching by song name instead of pasting the URL.'
  }
  if (lower.includes('private video') || lower.includes('age')) {
    return 'This YouTube video is restricted or private.'
  }

  return raw || 'Failed to load track from that URL'
}

/**
 * @param {import('shoukaku').LavalinkResponse | undefined} result
 * @returns {import('./queue.js').QueueTrack[]}
 */
export function tracksFromLavalinkResult(result, requestedBy) {
  if (!result) {
    throw Object.assign(new Error('Lavalink returned no data'), { status: 502, code: 'LAVALINK_ERROR' })
  }

  if (result.loadType === LoadType.ERROR) {
    throw Object.assign(new Error(friendlyLoadError(result.data)), {
      status: 400,
      code: 'TRACK_LOAD_FAILED',
    })
  }

  if (result.loadType === LoadType.EMPTY) {
    throw Object.assign(new Error('No tracks found for that query'), { status: 404, code: 'TRACK_NOT_FOUND' })
  }

  /** @type {import('shoukaku').Track[]} */
  let raw = []

  if (result.loadType === LoadType.TRACK) {
    raw = [result.data]
  } else if (result.loadType === LoadType.SEARCH) {
    raw = result.data.slice(0, 1)
  } else if (result.loadType === LoadType.PLAYLIST) {
    raw = result.data.tracks.slice(0, 10)
  }

  if (!raw.length) {
    throw Object.assign(new Error('No tracks found'), { status: 404, code: 'TRACK_NOT_FOUND' })
  }

  return raw.map((t) => ({
    encoded: t.encoded,
    title: t.info.title,
    author: t.info.author,
    length: t.info.length,
    uri: t.info.uri,
    requestedBy,
  }))
}
