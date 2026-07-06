import { clampVoiceBitrate, VOICE_BITRATE_DEFAULT } from './voiceBitrate'

const PREFS_KEY = 'voicedrop:prefs'

export interface UserPrefs {
  guildId: string
  guildName: string
  createCategory: boolean
  createTextChannel: boolean
  memberLimit: number
  bitrate: number
  region: string
  maxAge: number
  maxUses: number
  lastGameName: string
}

export const DEFAULT_PREFS: UserPrefs = {
  guildId: '',
  guildName: '',
  createCategory: true,
  createTextChannel: true,
  memberLimit: 0,
  bitrate: VOICE_BITRATE_DEFAULT,
  region: '',
  maxAge: 86400,
  maxUses: 0,
  lastGameName: '',
}

export function loadUserPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<UserPrefs>
    return { ...DEFAULT_PREFS, ...parsed, bitrate: clampVoiceBitrate(parsed.bitrate) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function saveUserPrefs(partial: Partial<UserPrefs>) {
  try {
    const next = { ...loadUserPrefs(), ...partial }
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
