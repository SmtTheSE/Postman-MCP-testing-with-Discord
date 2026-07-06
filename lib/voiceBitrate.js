/** Discord voice bitrate limits (bps). Most servers cap at 96 kbps without boosts. */
export const VOICE_BITRATE_MIN = 8000
export const VOICE_BITRATE_MAX = 96000
export const VOICE_BITRATE_DEFAULT = 64000

export function clampVoiceBitrate(bitrate) {
  const n = Number(bitrate)
  if (!Number.isFinite(n)) return VOICE_BITRATE_DEFAULT
  return Math.min(VOICE_BITRATE_MAX, Math.max(VOICE_BITRATE_MIN, Math.round(n)))
}
