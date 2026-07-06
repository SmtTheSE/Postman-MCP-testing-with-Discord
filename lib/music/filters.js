import { requireMusicStack } from './bot.js'

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

export function buildMoodPlayerOptions(mood) {
  if (!mood || mood === 'normal') {
    return { filters: {}, volume: 100 }
  }

  const preset = MOOD_FILTERS[mood]
  if (!preset) {
    return { filters: {}, volume: 100 }
  }

  const { volume, ...filters } = preset
  return {
    filters,
    ...(volume != null ? { volume: Math.round(volume * 100) } : {}),
  }
}

export async function applyMoodFilters(guildId, mood) {
  const { shoukaku } = requireMusicStack()
  const node = shoukaku.getIdealNode()
  if (!node) return

  const playerOptions = buildMoodPlayerOptions(mood)
  await node.rest.updatePlayer({ guildId, playerOptions })
}
