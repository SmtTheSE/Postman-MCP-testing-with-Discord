import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

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
}

export interface CreateChannelParams {
  guildId: string
  channelName: string
  gameName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
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
  message: string | null
}

export const discordApi = {
  getAuthStatus: async (): Promise<AuthStatus> => {
    const { data } = await api.get('/auth/status')
    return data
  },

  getMe: async (): Promise<{ authenticated: boolean; user?: DiscordUser }> => {
    try {
      const { data } = await api.get('/auth/me')
      return data
    } catch {
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

  createVoiceChannel: async (params: CreateChannelParams): Promise<CreateChannelResult> => {
    const { data } = await api.post('/create-channel', params)
    return data
  },

  health: async () => {
    const { data } = await api.get('/health')
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