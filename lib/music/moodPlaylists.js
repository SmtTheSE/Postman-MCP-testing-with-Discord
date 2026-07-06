import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLAYLISTS_PATH = path.resolve(__dirname, '../../server/data/mood-playlists.json')

export function listMoodPlaylists() {
  try {
    const raw = fs.readFileSync(PLAYLISTS_PATH, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function getMoodPlaylist(playlistId) {
  return listMoodPlaylists().find((p) => p.id === playlistId) || null
}
