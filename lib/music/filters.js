import { requireMusicStack } from './bot.js'
import { loadGuildState } from './stateStore.js'

const MOOD_FILTERS = {
  chill: {
    lowPass: { smoothing: 20 },
    volume: 0.85,
  },
  nightcore: {
    timescale: { speed: 1.2, pitch: 1.25, rate: 1 },
  },
  bassboost: {
    equalizer: [
      { band: 0, gain: 0.55 },
      { band: 1, gain: 0.45 },
      { band: 2, gain: 0.35 },
      { band: 3, gain: 0.2 },
    ],
  },
  '8d': {
    rotation: { rotationHz: 0.2 },
  },
}

const KARAOKE_FILTER = {
  level: 1,
  monoLevel: 1,
  filterBand: 220,
  filterWidth: 100,
}

export function buildPlayerFilters(mood, karaokeEnabled) {
  let filters = {}
  let volume = 100

  if (mood && mood !== 'normal') {
    const preset = MOOD_FILTERS[mood]
    if (preset) {
      const { volume: moodVolume, ...moodFilters } = preset
      filters = { ...moodFilters }
      if (moodVolume != null) volume = Math.round(moodVolume * 100)
    }
  }

  if (karaokeEnabled) {
    filters.karaoke = { ...KARAOKE_FILTER }
  }

  return { filters, volume }
}

/** @deprecated use applyPlaybackFilters */
export function buildMoodPlayerOptions(mood) {
  return buildPlayerFilters(mood, false)
}

export async function applyPlaybackFilters(guildId) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) return

  const state = loadGuildState(guildId)
  const playerOptions = buildPlayerFilters(state.mood || 'normal', Boolean(state.karaokeEnabled))
  await node.rest.updatePlayer({ guildId, playerOptions })
}

/** @deprecated use applyPlaybackFilters */
export async function applyMoodFilters(guildId, mood) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) return

  const state = loadGuildState(guildId)
  const playerOptions = buildPlayerFilters(mood, Boolean(state.karaokeEnabled))
  await node.rest.updatePlayer({ guildId, playerOptions })
}
