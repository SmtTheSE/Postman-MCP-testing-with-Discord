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
  botChannelId?: string | null
  channelMatch?: boolean
  lavalinkUdpConnected?: boolean
  lavalinkHasTrack?: boolean
  lavalinkPosition?: number
  playbackError?: string | null
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
  ): Promise<{ channels: VoiceChannel[]; categories: { id: string; name: string }[]; voiceCount: number }> => {
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

  skipMusic: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/skip', { guildId, channelId })
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
