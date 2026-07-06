import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../server/data/jukebox')

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
  repeat: 'off', // off, track, queue
  autoplay: false,
  lastChannelId: null,
  recentlyPlayed: [], // max 20 QueueTrack objects
}

export function loadGuildState(guildId) {
  try {
    ensureDir()
    const filePath = getFilePath(guildId)
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return { ...DEFAULT_STATE, ...JSON.parse(data) }
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
    const newState = { ...currentState, ...stateUpdates }

    // Ensure recentlyPlayed is bounded to max 20
    if (newState.recentlyPlayed && newState.recentlyPlayed.length > 20) {
      newState.recentlyPlayed = newState.recentlyPlayed.slice(0, 20)
    }

    fs.writeFileSync(getFilePath(guildId), JSON.stringify(newState, null, 2), 'utf8')
  } catch (error) {
    console.warn(`[stateStore] Failed to save state for guild ${guildId}: ${error.message}`)
  }
}

export function addRecentlyPlayed(guildId, track) {
    const state = loadGuildState(guildId)
    const recentlyPlayed = [track, ...state.recentlyPlayed].slice(0, 20)
    saveGuildState(guildId, { recentlyPlayed })
}
