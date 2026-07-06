import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import {
  discordApi,
  setUnauthorizedHandler,
  type CreateChannelParams,
  type CreateChannelResult,
  type DiscordUser,
  type GuildSummary,
} from '../services/discordApi'
import { useChannelWizard } from '../hooks/useChannelWizard'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { type GamePreset } from '../lib/gamePresets'
import { withTimeSuffix } from '../lib/channelNaming'
import { loadUserPrefs, saveUserPrefs } from '../lib/userPrefs'
import { clampVoiceBitrate } from '../lib/voiceBitrate'
import { useAlerts } from './AlertContext'

export interface RecentChannel {
  id: string
  name: string
  gameName: string
  inviteUrl: string
  guildId: string
  guildName?: string
  createdAt: string
  memberLimit: number
  bitrate: number
  region: string
  createCategory: boolean
  createTextChannel: boolean
  maxAge: number
  maxUses: number
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
  refreshGuilds: (options?: { force?: boolean }) => Promise<void>
  result: CreateChannelResult | null
  isSubmitting: boolean
  error: string | null
  submitChannel: () => Promise<void>
  quickDrop: () => Promise<void>
  recreateFromRecent: (channel: RecentChannel) => Promise<void>
  applyGamePreset: (preset: GamePreset) => void
  loadRecentToWizard: (channel: RecentChannel) => void
  clearResult: () => void
  recentChannels: RecentChannel[]
  clearRecentChannels: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const wizard = useChannelWizard()
  const { showCrud } = useAlerts()
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
  const guildsFetchedAtRef = useRef(0)
  const GUILDS_STALE_MS = 60_000

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true)
    try {
      const me = await discordApi.getMe()
      if (me.authenticated && me.user) {
        setUser(me.user)
        setAuthError(null)
      } else {
        setUser(null)
        if (me.needsLogin && me.message) {
          setAuthError(me.message)
        } else if (me.code === 'NOT_AUTHENTICATED' || me.code === 'TOKEN_EXPIRED') {
          setAuthError('Discord session expired — sign in again.')
        }
      }
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const refreshGuilds = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force
    if (
      !force &&
      guildsFetchedAtRef.current > 0 &&
      Date.now() - guildsFetchedAtRef.current < GUILDS_STALE_MS
    ) {
      return
    }
    if (guildsFetchRef.current) return guildsFetchRef.current

    const fetchPromise = (async () => {
      setGuildsLoading(true)
      setGuildsError(null)
      try {
        const data = await discordApi.listGuilds()
        setGuilds(data.guilds)
        guildsFetchedAtRef.current = Date.now()
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

  const createChannelWithParams = useCallback(
    async (params: CreateChannelParams, guildName?: string) => {
      setIsSubmitting(true)
      setError(null)

      const safeParams = { ...params, bitrate: clampVoiceBitrate(params.bitrate) }
      const resolvedGuildName = guildName || wizard.state.guildName || loadUserPrefs().guildName

      try {
        const res = await discordApi.createVoiceChannel(safeParams)

        saveUserPrefs({
          guildId: safeParams.guildId,
          guildName: resolvedGuildName,
          createCategory: safeParams.createCategory,
          createTextChannel: safeParams.createTextChannel,
          memberLimit: safeParams.memberLimit,
          bitrate: safeParams.bitrate,
          region: safeParams.region,
          maxAge: safeParams.maxAge,
          maxUses: safeParams.maxUses,
          lastGameName: safeParams.gameName,
        })

        const entry: RecentChannel = {
          id: res.channel.id,
          name: res.channel.name,
          gameName: safeParams.gameName,
          inviteUrl: res.inviteUrl,
          guildId: safeParams.guildId,
          guildName: resolvedGuildName,
          createdAt: new Date().toISOString(),
          memberLimit: safeParams.memberLimit,
          bitrate: safeParams.bitrate,
          region: safeParams.region,
          createCategory: safeParams.createCategory,
          createTextChannel: safeParams.createTextChannel,
          maxAge: safeParams.maxAge,
          maxUses: safeParams.maxUses,
        }

        setRecentChannels((prev) => [entry, ...prev].slice(0, 20))
        setResult(res)
        showCrud({
          operation: 'create',
          entity: 'Voice channel',
          success: true,
          detail: `${res.channel.name} is live — invite copied.`,
        })
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { error?: string } }
          message?: string
        }
        const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to create channel.'
        setError(msg)
        throw err
      } finally {
        setIsSubmitting(false)
      }
    },
    [wizard.state.guildName, setRecentChannels, showCrud],
  )

  const submitChannel = useCallback(async () => {
    await createChannelWithParams({
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
  }, [wizard.state, createChannelWithParams])

  const quickDrop = useCallback(async () => {
    const prefs = loadUserPrefs()
    if (!prefs.guildId) {
      setError('Pick a server once first — then Goofy Drop remembers it.')
      wizard.updateField('step', 3)
      return
    }

    const gameName = prefs.lastGameName || 'Gaming'
    const base = prefs.lastGameName || 'voice'
    wizard.updateField('guildId', prefs.guildId)
    wizard.updateField('guildName', prefs.guildName)
    wizard.updateField('gameName', gameName)

    await createChannelWithParams({
      guildId: prefs.guildId,
      channelName: withTimeSuffix(base),
      gameName,
      description: '',
      memberLimit: prefs.memberLimit,
      bitrate: prefs.bitrate,
      region: prefs.region,
      createCategory: prefs.createCategory,
      createTextChannel: prefs.createTextChannel,
      maxAge: prefs.maxAge,
      maxUses: prefs.maxUses,
    })
  }, [createChannelWithParams, wizard])

  const recreateFromRecent = useCallback(
    async (channel: RecentChannel) => {
      wizard.updateField('guildId', channel.guildId)
      wizard.updateField('guildName', channel.guildName || '')
      wizard.updateField('gameName', channel.gameName)

      await createChannelWithParams(
        {
          guildId: channel.guildId,
          channelName: withTimeSuffix(channel.gameName || channel.name),
          gameName: channel.gameName,
          description: '',
          memberLimit: channel.memberLimit ?? 0,
          bitrate: channel.bitrate ?? 64000,
          region: channel.region ?? '',
          createCategory: channel.createCategory ?? true,
          createTextChannel: channel.createTextChannel ?? true,
          maxAge: channel.maxAge ?? 86400,
          maxUses: channel.maxUses ?? 0,
        },
        channel.guildName,
      )
    },
    [createChannelWithParams, wizard],
  )

  const applyGamePreset = useCallback(
    (preset: GamePreset) => {
      wizard.updateField('gameName', preset.label)
      wizard.updateField('channelName', preset.channelName)
      wizard.updateField('memberLimit', preset.memberLimit)
      wizard.updateField('createTextChannel', preset.createTextChannel)
      wizard.updateField('createCategory', preset.createCategory)
    },
    [wizard],
  )

  const loadRecentToWizard = useCallback(
    (channel: RecentChannel) => {
      wizard.updateField('gameName', channel.gameName)
      wizard.updateField('channelName', channel.name)
      wizard.updateField('guildId', channel.guildId)
      if (channel.guildName) wizard.updateField('guildName', channel.guildName)
      if (channel.memberLimit != null) wizard.updateField('memberLimit', channel.memberLimit)
      if (channel.bitrate != null) wizard.updateField('bitrate', channel.bitrate)
      if (channel.region != null) wizard.updateField('region', channel.region)
      if (channel.createCategory != null) wizard.updateField('createCategory', channel.createCategory)
      if (channel.createTextChannel != null) wizard.updateField('createTextChannel', channel.createTextChannel)
      if (channel.maxAge != null) wizard.updateField('maxAge', channel.maxAge)
      if (channel.maxUses != null) wizard.updateField('maxUses', channel.maxUses)
      wizard.updateField('step', 3)
    },
    [wizard],
  )

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setAuthError('Discord session expired — sign in again.')
    })
    return () => setUnauthorizedHandler(() => {})
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
    if (user) refreshGuilds()
  }, [user, refreshGuilds])

  useEffect(() => {
    if (!user) return
    const prefs = loadUserPrefs()
    if (prefs.guildId && !wizard.state.guildId) {
      wizard.updateField('guildId', prefs.guildId)
      wizard.updateField('guildName', prefs.guildName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate prefs once on sign-in
  }, [user])

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
    guildsFetchedAtRef.current = 0
    wizard.updateField('guildId', '')
    wizard.updateField('guildName', '')
  }, [wizard])

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
        quickDrop,
        recreateFromRecent,
        applyGamePreset,
        loadRecentToWizard,
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
