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

/** @type {Set<string>} */
export const sfxActiveGuilds = new Set()

/** @type {Map<string, { track: object | null, position: number, paused: boolean }>} */
const sfxResume = new Map()

function readManifest() {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data.sounds) ? data.sounds : []
  } catch {
    return []
  }
}

export function listSoundboardSounds() {
  return readManifest().map(({ id, label, maxMs }) => ({ id, label, maxMs }))
}

export function getSoundboardSound(soundId) {
  return readManifest().find((s) => s.id === soundId) || null
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
  const sound = getSoundboardSound(soundId)
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
