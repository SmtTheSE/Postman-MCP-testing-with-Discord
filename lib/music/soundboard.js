import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { LoadType } from 'shoukaku'
import { getShoukakuPlayer, requireMusicStack } from './bot.js'
import { getSession, setNowPlaying } from './queue.js'
import { tracksFromLavalinkResult } from './resolve.js'
import { getLavalinkPlaybackState, playEncodedTrack } from './voice.js'
import { applyPlaybackFilters } from './filters.js'
import { incSoundboardPlays } from './metrics.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST_PATH = path.resolve(__dirname, '../../server/data/soundboard/manifest.json')
const UPLOADS_DIR = path.resolve(__dirname, '../../server/data/soundboard/uploads')
const CUSTOM_DIR = path.resolve(__dirname, '../../server/data/soundboard/custom')

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
const ALLOWED_EXT = new Set(['.mp3', '.ogg', '.wav', '.m4a'])

/** @type {Set<string>} */
export const sfxActiveGuilds = new Set()

/** @type {Map<string, { track: object | null, position: number, paused: boolean }>} */
const sfxResume = new Map()

function ensureDirs(guildId) {
  fs.mkdirSync(path.join(UPLOADS_DIR, guildId), { recursive: true })
  fs.mkdirSync(CUSTOM_DIR, { recursive: true })
}

function customManifestPath(guildId) {
  return path.join(CUSTOM_DIR, `${guildId}.json`)
}

function readBuiltInManifest() {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data.sounds) ? data.sounds : []
  } catch {
    return []
  }
}

function readCustomManifest(guildId) {
  try {
    const file = customManifestPath(guildId)
    if (!fs.existsSync(file)) return []
    const data = JSON.parse(fs.readFileSync(file, 'utf8'))
    return Array.isArray(data.sounds) ? data.sounds : []
  } catch {
    return []
  }
}

function saveCustomManifest(guildId, sounds) {
  ensureDirs(guildId)
  fs.writeFileSync(customManifestPath(guildId), JSON.stringify({ sounds }, null, 2), 'utf8')
}

function publicBaseUrl() {
  return process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`
}

function soundUrl(guildId, sound) {
  if (sound.url) return sound.url
  if (sound.file && guildId) {
    return `${publicBaseUrl()}/api/soundboard/files/${guildId}/${encodeURIComponent(sound.file)}`
  }
  return null
}

function normalizeSound(sound, guildId, custom = false) {
  return {
    id: sound.id,
    label: sound.label,
    maxMs: sound.maxMs || 5000,
    custom,
    url: soundUrl(guildId, sound),
  }
}

export function listSoundboardSounds(guildId) {
  const builtIn = readBuiltInManifest().map((s) => normalizeSound(s, null, false))
  const custom = guildId
    ? readCustomManifest(guildId).map((s) => normalizeSound(s, guildId, true))
    : []
  return [...builtIn, ...custom].map(({ id, label, maxMs, custom: isCustom }) => ({
    id,
    label,
    maxMs,
    custom: isCustom,
  }))
}

export function getSoundboardSound(soundId, guildId) {
  const builtIn = readBuiltInManifest().find((s) => s.id === soundId)
  if (builtIn) return { ...builtIn, url: soundUrl(null, builtIn) }

  if (guildId) {
    const custom = readCustomManifest(guildId).find((s) => s.id === soundId)
    if (custom) return { ...custom, url: soundUrl(guildId, custom) }
  }

  return null
}

export function getUploadedSoundPath(guildId, filename) {
  const safe = path.basename(filename)
  const full = path.resolve(UPLOADS_DIR, guildId, safe)
  if (!full.startsWith(path.resolve(UPLOADS_DIR, guildId))) {
    throw Object.assign(new Error('Invalid sound file path'), { status: 400, code: 'INVALID_FILE' })
  }
  if (!fs.existsSync(full)) {
    throw Object.assign(new Error('Sound file not found'), { status: 404, code: 'SOUND_NOT_FOUND' })
  }
  return full
}

export function addCustomSound(guildId, { label, filename, buffer, maxMs }) {
  if (!label?.trim()) {
    throw Object.assign(new Error('Label is required'), { status: 400, code: 'INVALID_REQUEST' })
  }
  if (!buffer?.length) {
    throw Object.assign(new Error('Audio file is required'), { status: 400, code: 'INVALID_REQUEST' })
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error('File too large (max 2 MB)'), { status: 400, code: 'FILE_TOO_LARGE' })
  }

  const ext = path.extname(filename || '').toLowerCase()
  if (!ALLOWED_EXT.has(ext)) {
    throw Object.assign(new Error('Allowed formats: mp3, ogg, wav, m4a'), { status: 400, code: 'INVALID_FORMAT' })
  }

  ensureDirs(guildId)
  const id = `custom-${Date.now()}`
  const storedName = `${id}${ext}`
  fs.writeFileSync(path.join(UPLOADS_DIR, guildId, storedName), buffer)

  const entry = { id, label: label.trim(), file: storedName, maxMs: Math.min(maxMs || 5000, 8000) }
  const sounds = [...readCustomManifest(guildId), entry]
  saveCustomManifest(guildId, sounds)

  return { id: entry.id, label: entry.label, maxMs: entry.maxMs, custom: true }
}

export function removeCustomSound(guildId, soundId) {
  const sounds = readCustomManifest(guildId)
  const target = sounds.find((s) => s.id === soundId)
  if (!target) {
    throw Object.assign(new Error('Custom sound not found'), { status: 404, code: 'SOUND_NOT_FOUND' })
  }

  const filePath = path.join(UPLOADS_DIR, guildId, target.file)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  saveCustomManifest(
    guildId,
    sounds.filter((s) => s.id !== soundId),
  )

  return { success: true }
}

export async function resumeAfterSoundboard(guildId, channelId) {
  const resume = sfxResume.get(guildId)
  sfxResume.delete(guildId)
  sfxActiveGuilds.delete(guildId)

  const player = getShoukakuPlayer(guildId)
  if (!player) return

  await applyPlaybackFilters(guildId)

  if (!resume?.track) return

  setNowPlaying(guildId, channelId, resume.track)
  await playEncodedTrack(player, resume.track.encoded)

  if (resume.position > 0) {
    try {
      await player.seekTo(resume.position)
    } catch {
      // seek unsupported or failed — track restarts from beginning
    }
  }

  if (resume.paused) {
    await player.setPaused(true)
  }
}

export async function playSoundboard(guildId, channelId, soundId) {
  const sound = getSoundboardSound(soundId, guildId)
  if (!sound?.url) {
    throw Object.assign(new Error('Unknown soundboard clip'), { status: 404, code: 'SOUND_NOT_FOUND' })
  }

  const player = getShoukakuPlayer(guildId)
  if (!player) {
    throw Object.assign(new Error('Bot is not in a voice channel'), { status: 400, code: 'NOT_IN_VOICE' })
  }

  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) {
    throw Object.assign(new Error('No Lavalink node available'), { status: 503, code: 'LAVALINK_OFFLINE' })
  }

  const session = getSession(guildId, channelId)
  const lavalink = await getLavalinkPlaybackState(guildId)

  sfxResume.set(guildId, {
    track: session?.nowPlaying || null,
    position: lavalink.position || 0,
    paused: Boolean(player.paused),
  })
  sfxActiveGuilds.add(guildId)

  const result = await node.rest.resolve(sound.url)
  if (result?.loadType === LoadType.ERROR || result?.loadType === LoadType.EMPTY) {
    sfxResume.delete(guildId)
    sfxActiveGuilds.delete(guildId)
    throw Object.assign(new Error('Could not load sound clip'), { status: 502, code: 'SOUND_LOAD_FAILED' })
  }

  const tracks = tracksFromLavalinkResult(result, 'soundboard')
  if (!tracks.length) {
    sfxResume.delete(guildId)
    sfxActiveGuilds.delete(guildId)
    throw Object.assign(new Error('Sound clip resolved to no audio'), { status: 502, code: 'SOUND_LOAD_FAILED' })
  }

  await node.rest.updatePlayer({
    guildId,
    playerOptions: { volume: 35 },
  })

  await player.playTrack({
    track: { encoded: tracks[0].encoded },
    volume: 150,
    paused: false,
  })

  incSoundboardPlays()

  const maxMs = sound.maxMs || 5000
  setTimeout(() => {
    if (sfxActiveGuilds.has(guildId)) {
      resumeAfterSoundboard(guildId, channelId).catch((err) => {
        console.warn(`[soundboard] resume failed guild=${guildId}:`, err.message)
      })
    }
  }, maxMs)

  return { success: true, sound: { id: sound.id, label: sound.label } }
}
