import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  discordApi,
  type CreateChannelResult,
  type DiscordUser,
  type GuildSummary,
} from '../services/discordApi'
import { useChannelWizard } from '../hooks/useChannelWizard'
import { useLocalStorage } from '../hooks/useLocalStorage'

export interface RecentChannel {
  id: string
  name: string
  gameName: string
  inviteUrl: string
  guildId: string
  guildName?: string
  createdAt: string
}

interface AppContextType {
  wizard: ReturnType<typeof useChannelWizard>
  user: DiscordUser | null
  authLoading: boolean
  guilds: GuildSummary[]
  guildsLoading: boolean
  guildsError: string | null
  authError: string | null
  clearAuthError: () => void
  login: () => void
  logout: () => Promise<void>
  refreshGuilds: () => Promise<void>
  result: CreateChannelResult | null
  isSubmitting: boolean
  error: string | null
  submitChannel: () => Promise<void>
  clearResult: () => void
  recentChannels: RecentChannel[]
  clearRecentChannels: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const wizard = useChannelWizard()
  const [user, setUser] = useState<DiscordUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [guilds, setGuilds] = useState<GuildSummary[]>([])
  const [guildsLoading, setGuildsLoading] = useState(false)
  const [guildsError, setGuildsError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [result, setResult] = useState<CreateChannelResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentChannels, setRecentChannels] = useLocalStorage<RecentChannel[]>('voicedrop:recent', [])
  const guildsFetchRef = useRef<Promise<void> | null>(null)

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true)
    try {
      const me = await discordApi.getMe()
      setUser(me.authenticated && me.user ? me.user : null)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const refreshGuilds = useCallback(async () => {
    if (guildsFetchRef.current) return guildsFetchRef.current

    const fetchPromise = (async () => {
      setGuildsLoading(true)
      setGuildsError(null)
      try {
        const data = await discordApi.listGuilds()
        setGuilds(data.guilds)
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
        setGuildsError(axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to load servers')
        setGuilds([])
      } finally {
        setGuildsLoading(false)
        guildsFetchRef.current = null
      }
    })()

    guildsFetchRef.current = fetchPromise
    return fetchPromise
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    if (auth) {
      window.history.replaceState({}, '', window.location.pathname)
      if (auth === 'success') {
        refreshAuth()
      } else if (auth === 'not_configured') {
        setAuthError(
          'OAuth not configured. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to discord-mcp/.env. Redirect URI: http://localhost:5173/api/auth/callback — then restart npm run dev.',
        )
      } else if (auth === 'denied') {
        setAuthError('Discord sign-in was cancelled.')
      } else if (auth === 'error') {
        setAuthError(
          'Discord sign-in failed. Confirm redirect URI matches your app URL + /api/auth/callback.',
        )
      }
    }
  }, [refreshAuth, refreshGuilds])

  useEffect(() => {
    if (user && wizard.state.step === 3) {
      refreshGuilds()
    }
  }, [user, wizard.state.step, refreshGuilds])

  const login = useCallback(async () => {
    setAuthError(null)
    try {
      const status = await discordApi.getAuthStatus()
      if (!status.ready) {
        setAuthError(
          status.message ||
            'OAuth not ready. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to discord-mcp/.env, then restart npm run dev.',
        )
        return
      }
      window.location.href = '/api/auth/discord'
    } catch {
      setAuthError('Cannot reach API. Make sure npm run dev is running (api + web).')
    }
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const logout = useCallback(async () => {
    await discordApi.logout()
    setUser(null)
    setGuilds([])
    wizard.updateField('guildId', '')
    wizard.updateField('guildName', '')
  }, [wizard])

  const submitChannel = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await discordApi.createVoiceChannel({
        guildId: wizard.state.guildId,
        channelName: wizard.state.channelName,
        gameName: wizard.state.gameName,
        description: wizard.state.description,
        memberLimit: wizard.state.memberLimit,
        bitrate: wizard.state.bitrate,
        region: wizard.state.region,
        createCategory: wizard.state.createCategory,
        createTextChannel: wizard.state.createTextChannel,
        maxAge: wizard.state.maxAge,
        maxUses: wizard.state.maxUses,
      })

      setRecentChannels((prev) => {
        const entry: RecentChannel = {
          id: res.channel.id,
          name: res.channel.name,
          gameName: wizard.state.gameName,
          inviteUrl: res.inviteUrl,
          guildId: wizard.state.guildId,
          guildName: wizard.state.guildName,
          createdAt: new Date().toISOString(),
        }
        return [entry, ...prev].slice(0, 20)
      })

      setResult(res)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string } }
        message?: string
      }
      const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to create channel.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }, [wizard.state, setRecentChannels])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
    wizard.reset()
  }, [wizard])

  const clearRecentChannels = useCallback(() => {
    setRecentChannels([])
  }, [setRecentChannels])

  return (
    <AppContext.Provider
      value={{
        wizard,
        user,
        authLoading,
        guilds,
        guildsLoading,
        guildsError,
        authError,
        clearAuthError,
        login,
        logout,
        refreshGuilds,
        result,
        isSubmitting,
        error,
        submitChannel,
        clearResult,
        recentChannels,
        clearRecentChannels,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}