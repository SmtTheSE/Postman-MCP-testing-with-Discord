import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GLOBAL_PATH = path.resolve(__dirname, '../../server/data/mood-playlists.json')
const CUSTOM_DIR = path.resolve(__dirname, '../../server/data/mood-playlists/custom')

const ALLOWED_MOODS = new Set(['normal', 'chill', 'nightcore', 'bassboost', '8d'])

function readGlobalPlaylists() {
  try {
    const raw = fs.readFileSync(GLOBAL_PATH, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function guildPath(guildId) {
  return path.join(CUSTOM_DIR, `${guildId}.json`)
}

function readGuildPlaylists(guildId) {
  if (!guildId) return []
  try {
    fs.mkdirSync(CUSTOM_DIR, { recursive: true })
    const file = guildPath(guildId)
    if (!fs.existsSync(file)) return []
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(data.playlists) ? data.playlists : []
  } catch {
    return []
  }
}

function saveGuildPlaylists(guildId, playlists) {
  fs.mkdirSync(CUSTOM_DIR, { recursive: true })
  fs.writeFileSync(guildPath(guildId), JSON.stringify({ playlists }, null, 2), 'utf8')
}

function normalizePlaylist(raw, custom) {
  const mood = ALLOWED_MOODS.has(raw.mood) ? raw.mood : 'normal'
  const trackCount = Math.min(10, Math.max(1, Number(raw.trackCount) || 5))
  return {
    id: String(raw.id),
    label: String(raw.label || 'Custom playlist').trim(),
    mood,
    search: String(raw.search || '').trim(),
    trackCount,
    custom,
  }
}

export function listMoodPlaylists(guildId) {
  const global = readGlobalPlaylists().map((p) => normalizePlaylist(p, false))
  const custom = readGuildPlaylists(guildId).map((p) => normalizePlaylist(p, true))
  return [...global, ...custom]
}

export function getMoodPlaylist(playlistId, guildId) {
  return listMoodPlaylists(guildId).find((p) => p.id === playlistId) || null
}

export function upsertGuildPlaylist(guildId, payload) {
  if (!guildId) {
    throw Object.assign(new Error('guildId is required'), { status: 400, code: 'INVALID_REQUEST' })
  }
  if (!payload?.label?.trim() || !payload?.search?.trim()) {
    throw Object.assign(new Error('Label and search query are required'), { status: 400, code: 'INVALID_REQUEST' })
  }

  const playlists = readGuildPlaylists(guildId)
  const next = normalizePlaylist(
    {
      id: payload.id || `custom-${Date.now()}`,
      label: payload.label,
      mood: payload.mood,
      search: payload.search,
      trackCount: payload.trackCount,
    },
    true,
  )

  const idx = playlists.findIndex((p) => p.id === next.id)
  if (idx >= 0) {
    playlists[idx] = next
  } else {
    playlists.push(next)
  }

  saveGuildPlaylists(guildId, playlists)
  return next
}

export function deleteGuildPlaylist(guildId, playlistId) {
  if (!guildId || !playlistId) {
    throw Object.assign(new Error('guildId and playlistId are required'), { status: 400, code: 'INVALID_REQUEST' })
  }

  const global = readGlobalPlaylists()
  if (global.some((p) => p.id === playlistId)) {
    throw Object.assign(new Error('Built-in playlists cannot be deleted'), { status: 403, code: 'READ_ONLY_PLAYLIST' })
  }

  const playlists = readGuildPlaylists(guildId).filter((p) => p.id !== playlistId)
  if (playlists.length === readGuildPlaylists(guildId).length) {
    throw Object.assign(new Error('Custom playlist not found'), { status: 404, code: 'PLAYLIST_NOT_FOUND' })
  }

  saveGuildPlaylists(guildId, playlists)
  return { success: true }
}
