import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    if (status === 401 && onUnauthorized && (code === 'NOT_AUTHENTICATED' || code === 'TOKEN_EXPIRED')) {
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

export interface DiscordUser {
  id: string
  username: string
  globalName: string
  avatar: string | null
}

export interface GuildSummary {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  permissions?: string
  approximate_member_count?: number
  approximate_presence_count?: number
}

export interface VoiceChannel {
  id: string
  name: string
  type: number
  guild_id: string
  parent_id: string | null
  categoryName: string | null
  bitrate?: number
  user_limit?: number
  rtc_region?: string | null
  topic?: string | null
  position?: number
}

export interface GuildInvite {
  code: string
  url: string | null
  channel?: { id: string; name: string; type: number } | null
  inviter?: { username: string } | null
  uses?: number
  max_uses?: number
  max_age?: number
  expires_at?: string | null
  temporary?: boolean
}

export interface CreateChannelParams {
  guildId: string
  channelName: string
  gameName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
  createCategory: boolean
  createTextChannel: boolean
  maxAge: number
  maxUses: number
}

export interface CreateChannelResult {
  success: boolean
  channel: { id: string; name: string; type: number }
  inviteUrl: string
}

export interface AuthStatus {
  ready: boolean
  bot: boolean
  oauth: boolean
  clientId: boolean
  redirectUri: string
  botInviteUrl?: string | null
  message: string | null
}

export interface TextChannel {
  id: string
  name: string
  type: number
  guild_id: string
  parent_id: string | null
  categoryName: string | null
  topic?: string | null
  position?: number
}

export interface SoundboardClip {
  id: string
  label: string
  maxMs?: number
  custom?: boolean
}

export interface MoodPlaylist {
  id: string
  label: string
  mood: string
  search: string
  trackCount: number
  custom?: boolean
}

export interface LyricsResult {
  success: boolean
  track?: MusicTrack
  lyrics?: {
    found: boolean
    plain: string | null
    synced: string | null
    source?: string
  }
}

export interface MusicHistoryResult {
  success: boolean
  history: MusicTrack[]
}

export interface MusicFavoritesResult {
  success: boolean
  favorites: MusicTrack[]
}

export interface MusicTrack {
  encoded: string
  title: string
  author: string
  length: number
  uri?: string
  requestedBy?: string
}

export interface MusicQueueStatus {
  connected: boolean
  nowPlaying: MusicTrack | null
  queue: MusicTrack[]
  paused: boolean
  queueLength: number
  state: 'idle' | 'joining' | 'ready' | 'playing' | 'paused' | 'error'
  settings?: {
      repeat: 'off' | 'track' | 'queue'
      autoplay: boolean
      announceChannelId?: string | null
      mood?: string
      karaokeEnabled?: boolean
      djRouletteEnabled?: boolean
  }
  dj?: {
    enabled: boolean
    userId: string | null
    username: string | null
  }
  playbackError?: string | null
  playbackErrorCode?: string | null
  botChannelId?: string | null
  channelMatch?: boolean
  lavalinkUdpConnected?: boolean
  lavalinkHasTrack?: boolean
  lavalinkPosition?: number
}

export const discordApi = {
  getAuthStatus: async (): Promise<AuthStatus> => {
    const { data } = await api.get('/auth/status')
    return data
  },

  getMe: async (): Promise<{
    authenticated: boolean
    user?: DiscordUser
    needsLogin?: boolean
    message?: string
    code?: string
  }> => {
    try {
      const { data } = await api.get('/auth/me')
      return data
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } }
      if (axiosErr.response?.data) {
        return axiosErr.response.data as {
          authenticated: boolean
          needsLogin?: boolean
          message?: string
          code?: string
        }
      }
      return { authenticated: false }
    }
  },

  login: () => {
    window.location.href = '/api/auth/discord'
  },

  logout: async () => {
    await api.post('/auth/logout')
  },

  listGuilds: async (): Promise<{ guilds: GuildSummary[]; total: number; manageable: number }> => {
    const { data } = await api.get('/guilds')
    return data
  },

  listVoiceChannels: async (
    guildId: string,
    options?: { jukebox?: boolean },
  ): Promise<{ channels: VoiceChannel[]; textChannels?: TextChannel[]; categories: { id: string; name: string }[]; voiceCount: number }> => {
    const { data } = await api.get('/channels', {
      params: { guild_id: guildId, ...(options?.jukebox ? { scope: 'jukebox' } : {}) },
    })
    return data
  },

  updateChannel: async (
    channelId: string,
    updates: {
      name?: string
      user_limit?: number
      bitrate?: number
      topic?: string
      rtc_region?: string
      parent_id?: string | null
    },
  ) => {
    const { data } = await api.patch('/channels', { channel_id: channelId, ...updates })
    return data
  },

  deleteChannel: async (channelId: string) => {
    const { data } = await api.delete('/channels', { data: { channel_id: channelId } })
    return data
  },

  listGuildInvites: async (guildId: string): Promise<{ invites: GuildInvite[] }> => {
    const { data } = await api.get('/invites', { params: { guild_id: guildId } })
    return data
  },

  revokeInvite: async (code: string) => {
    const { data } = await api.delete('/invites', { data: { code } })
    return data
  },

  createVoiceChannel: async (params: CreateChannelParams): Promise<CreateChannelResult> => {
    const { data } = await api.post('/create-channel', params)
    return data
  },

  health: async () => {
    const { data } = await api.get('/health')
    return data
  },

  joinMusic: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/join', { guildId, channelId })
    return data
  },

  playMusic: async (guildId: string, channelId: string, query: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/play', { guildId, channelId, query })
    return data
  },

  playNextMusic: async (guildId: string, channelId: string, query: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/play-next', { guildId, channelId, query })
    return data
  },

  skipMusic: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/skip', { guildId, channelId })
    return data
  },

  voteSkipMusic: async (
    guildId: string,
    channelId: string,
  ): Promise<MusicQueueStatus & { voteSkip?: { votes?: number; needed?: number; skipped: boolean; forced?: boolean } }> => {
    const { data } = await api.post('/music/vote-skip', { guildId, channelId })
    return data
  },

  pauseMusic: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/pause', { guildId, channelId })
    return data
  },

  leaveMusic: async (guildId: string, channelId: string) => {
    const { data } = await api.post('/music/leave', { guildId, channelId })
    return data
  },

  getMusicQueue: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.get('/music/queue', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  getHistory: async (guildId: string, channelId: string): Promise<MusicHistoryResult> => {
    const { data } = await api.get('/music/history', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  requeueHistory: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/history/requeue', { guildId, channelId, track })
    return data
  },

  getFavorites: async (guildId: string, channelId: string): Promise<MusicFavoritesResult> => {
    const { data } = await api.get('/music/favorites', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  addFavorite: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicFavoritesResult> => {
    const { data } = await api.post('/music/favorites', { guildId, channelId, track })
    return data
  },

  removeFavorite: async (guildId: string, channelId: string, encoded: string): Promise<MusicFavoritesResult> => {
    const { data } = await api.delete('/music/favorites', { data: { guildId, channelId, encoded } })
    return data
  },

  playFavorite: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/favorites/play', { guildId, channelId, track })
    return data
  },

  playNextFavorite: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/favorites/play-next', { guildId, channelId, track })
    return data
  },

  removeTrack: async (guildId: string, channelId: string, index: number): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/remove', { guildId, channelId, index })
    return data
  },

  moveTrack: async (guildId: string, channelId: string, fromIndex: number, toIndex: number): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/move', { guildId, channelId, fromIndex, toIndex })
    return data
  },

  clearQueue: async (guildId: string, channelId: string, keepNowPlaying?: boolean): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/clear', { guildId, channelId, keepNowPlaying })
    return data
  },

  shuffleQueue: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/shuffle', { guildId, channelId })
    return data
  },

  repeatMusic: async (guildId: string, channelId: string, mode: 'off' | 'track' | 'queue'): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/repeat', { guildId, channelId, mode })
    return data
  },

  autoplayMusic: async (guildId: string, channelId: string, enabled: boolean): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/autoplay', { guildId, channelId, enabled })
    return data
  },

  setMood: async (guildId: string, channelId: string, mood: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/mood', { guildId, channelId, mood })
    return data
  },

  setKaraoke: async (guildId: string, channelId: string, enabled: boolean): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/karaoke', { guildId, channelId, enabled })
    return data
  },

  setAnnounceChannel: async (
    guildId: string,
    musicChannelId: string,
    announceChannelId: string | null,
  ): Promise<MusicQueueStatus & { announceChannelId: string | null }> => {
    const { data } = await api.post('/music/settings/announce', { guildId, musicChannelId, announceChannelId })
    return data
  },

  spinDjRoulette: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/dj-roulette/spin', { guildId, channelId })
    return data
  },

  toggleDjRoulette: async (guildId: string, channelId: string, enabled: boolean): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/dj-roulette/toggle', { guildId, channelId, enabled })
    return data
  },

  listSoundboard: async (guildId?: string): Promise<{ success: boolean; sounds: SoundboardClip[] }> => {
    const { data } = await api.get('/music/soundboard', { params: guildId ? { guild_id: guildId } : {} })
    return data
  },

  uploadSoundboard: async (
    guildId: string,
    musicChannelId: string,
    payload: { label: string; filename: string; dataBase64: string; maxMs?: number },
  ): Promise<{ success: boolean; sounds: SoundboardClip[] }> => {
    const { data } = await api.post('/music/soundboard/upload', { guildId, musicChannelId, ...payload })
    return data
  },

  deleteSoundboard: async (guildId: string, soundId: string): Promise<{ success: boolean; sounds: SoundboardClip[] }> => {
    const { data } = await api.delete('/music/soundboard/upload', { data: { guildId, soundId } })
    return data
  },

  playSoundboard: async (guildId: string, channelId: string, soundId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/soundboard/play', { guildId, channelId, soundId })
    return data
  },

  getLyrics: async (guildId: string, channelId: string): Promise<LyricsResult> => {
    const { data } = await api.get('/music/lyrics', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  listMoodPlaylists: async (guildId?: string): Promise<{ success: boolean; playlists: MoodPlaylist[] }> => {
    const { data } = await api.get('/music/mood-playlists', { params: guildId ? { guild_id: guildId } : {} })
    return data
  },

  saveMoodPlaylist: async (
    guildId: string,
    payload: { id?: string; label: string; mood: string; search: string; trackCount?: number },
  ): Promise<{ success: boolean; playlist: MoodPlaylist; playlists: MoodPlaylist[] }> => {
    const { data } = await api.post('/music/mood-playlists', { guildId, ...payload })
    return data
  },

  deleteMoodPlaylist: async (
    guildId: string,
    playlistId: string,
  ): Promise<{ success: boolean; playlists: MoodPlaylist[] }> => {
    const { data } = await api.delete('/music/mood-playlists', { data: { guildId, playlistId } })
    return data
  },

  queueMoodPlaylist: async (guildId: string, channelId: string, playlistId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/mood-playlists/queue', { guildId, channelId, playlistId })
    return data
  },
}

export function guildIconUrl(guild: GuildSummary, size = 64) {
  if (!guild.icon) return null
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`
}

export function userAvatarUrl(user: DiscordUser, size = 64) {
  if (!user.avatar) {
    const idx = Number(BigInt(user.id) % 6n)
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`
  }
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`
}

export function voiceChannelDeepLink(guildId: string, channelId: string) {
  return `https://discord.com/channels/${guildId}/${channelId}`
}
