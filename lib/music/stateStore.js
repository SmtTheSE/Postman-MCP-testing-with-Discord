import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../server/data/jukebox')
const MAX_HISTORY = 100
const MAX_FAVORITES = 50

function getFilePath(guildId) {
  return path.join(DATA_DIR, `${guildId}.json`)
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

const DEFAULT_STATE = {
  lastQuery: '',
  repeat: 'off',
  autoplay: false,
  lastChannelId: null,
  history: [],
  favoritesByUser: {},
  announceChannelId: null,
  mood: 'normal',
}

function migrateState(raw) {
  const state = { ...DEFAULT_STATE, ...raw }
  if ((!state.history || state.history.length === 0) && raw.recentlyPlayed?.length) {
    state.history = raw.recentlyPlayed
  }
  delete state.recentlyPlayed
  if (!state.favoritesByUser || typeof state.favoritesByUser !== 'object') {
    state.favoritesByUser = {}
  }
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(0, MAX_HISTORY)
  }
  return state
}

export function loadGuildState(guildId) {
  try {
    ensureDir()
    const filePath = getFilePath(guildId)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return migrateState(JSON.parse(data))
    }
  } catch (error) {
    console.warn(`[stateStore] Failed to load state for guild ${guildId}: ${error.message}`)
  }
  return { ...DEFAULT_STATE }
}

export function saveGuildState(guildId, stateUpdates) {
  try {
    ensureDir()
    const currentState = loadGuildState(guildId)
    const newState = migrateState({ ...currentState, ...stateUpdates })
    if (newState.history.length > MAX_HISTORY) {
      newState.history = newState.history.slice(0, MAX_HISTORY)
    }
    fs.writeFileSync(getFilePath(guildId), JSON.stringify(newState, null, 2), 'utf8')
  } catch (error) {
    console.warn(`[stateStore] Failed to save state for guild ${guildId}: ${error.message}`)
  }
}

export function addToHistory(guildId, track) {
  const state = loadGuildState(guildId)
  const history = [track, ...state.history.filter((t) => t.encoded !== track.encoded)].slice(0, MAX_HISTORY)
  saveGuildState(guildId, { history })
}

/** @deprecated use addToHistory */
export function addRecentlyPlayed(guildId, track) {
  addToHistory(guildId, track)
}

export function getHistory(guildId) {
  return loadGuildState(guildId).history
}

export function getUserFavorites(guildId, userId) {
  const state = loadGuildState(guildId)
  return state.favoritesByUser[String(userId)] || []
}

export function addUserFavorite(guildId, userId, track) {
  const state = loadGuildState(guildId)
  const key = String(userId)
  const list = state.favoritesByUser[key] || []
  const next = [track, ...list.filter((t) => t.encoded !== track.encoded)].slice(0, MAX_FAVORITES)
  saveGuildState(guildId, { favoritesByUser: { ...state.favoritesByUser, [key]: next } })
  return next
}

export function removeUserFavorite(guildId, userId, encoded) {
  const state = loadGuildState(guildId)
  const key = String(userId)
  const next = (state.favoritesByUser[key] || []).filter((t) => t.encoded !== encoded)
  saveGuildState(guildId, { favoritesByUser: { ...state.favoritesByUser, [key]: next } })
  return next
}
