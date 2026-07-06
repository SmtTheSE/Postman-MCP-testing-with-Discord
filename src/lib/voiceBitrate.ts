export const VOICE_BITRATE_MIN = 8000
export const VOICE_BITRATE_MAX = 96000
export const VOICE_BITRATE_DEFAULT = 64000

export const VOICE_BITRATE_OPTIONS = [
  { label: '64 kbps', value: 64000 },
  { label: '96 kbps', value: 96000 },
] as const

export function clampVoiceBitrate(bitrate: number | null | undefined): number {
  const n = Number(bitrate)
  if (!Number.isFinite(n)) return VOICE_BITRATE_DEFAULT
  return Math.min(VOICE_BITRATE_MAX, Math.max(VOICE_BITRATE_MIN, Math.round(n)))
}
