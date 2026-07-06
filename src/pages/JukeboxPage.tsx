import { useCallback, useEffect, useMemo, useState } from 'react'
import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { discordApi, guildIconUrl, voiceChannelDeepLink, type VoiceChannel } from '../services/discordApi'
import { loadUserPrefs, saveUserPrefs } from '../lib/userPrefs'
import { CustomAlert } from '../components/ui/Alert'
import { DiscordSignInButton } from '../components/DiscordSignInButton'
import { useAlerts } from '../context/AlertContext'
import type { MusicQueueStatus, MusicTrack } from '../services/discordApi'

function formatDuration(ms: number) {
  if (!ms || ms < 0) return '—'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function TrackRow({ track, label, index: _index, onRemove: _onRemove, onMoveUp: _onMoveUp, onMoveDown: _onMoveDown }: { track: MusicTrack; label?: string; index?: number; onRemove?: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {
  return (
    <div className="jukebox-track">
      <div className="jukebox-track-icon" aria-hidden>
        <Music2 className="w-4 h-4" />
      </div>
      <div className="jukebox-track-body">
        {label && <span className="jukebox-track-label">{label}</span>}
        <span className="jukebox-track-title">{track.title}</span>
        <span className="jukebox-track-meta">
          {track.author} · {formatDuration(track.length)}
        </span>
      </div>
    </div>
  )
}

export function JukeboxPage() {
  const { user, authLoading, authError, login, guilds, guildsLoading, guildsError } = useApp()
  const { showToast } = useAlerts()
  const [guildId, setGuildId] = useState(() => loadUserPrefs().guildId)
  const [channelId, setChannelId] = useState('')
  const [channels, setChannels] = useState<VoiceChannel[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<MusicQueueStatus | null>(null)
  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [botInviteUrl, setBotInviteUrl] = useState<string | null>(null)
  const [musicReady, setMusicReady] = useState<boolean | null>(null)

  const uniqueGuilds = useMemo(() => {
    const seen = new Set<string>()
    return guilds.filter((g) => {
      if (seen.has(g.id)) return false
      seen.add(g.id)
      return true
    })
  }, [guilds])

  const listenChannelId = status?.botChannelId || channelId
  const botChannelName = channels.find((c) => c.id === status?.botChannelId)?.name
  const selectedGuild = uniqueGuilds.find((g) => g.id === guildId)

  useEffect(() => {
    discordApi.health().then((h) => {
      setMusicReady(Boolean(h.music?.ready))
    }).catch(() => setMusicReady(false))
  }, [])

  const refreshQueue = useCallback(async (gId: string, cId: string) => {
    if (!gId || !cId) return
    try {
      const q = await discordApi.getMusicQueue(gId, cId)
      setStatus(q)
    } catch {
      /* queue may not exist yet */
    }
  }, [])

  const loadChannels = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    setBotInviteUrl(null)
    try {
      const res = await discordApi.listVoiceChannels(id, { jukebox: true })
      setChannels(res.channels)
      setChannelId((current) => {
        if (res.channels.length && !res.channels.some((c) => c.id === current)) {
          return res.channels[0].id
        }
        return current
      })
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; botInviteUrl?: string } }
        message?: string
      }
      setError(axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to load voice channels')
      if (axiosErr?.response?.data?.botInviteUrl) setBotInviteUrl(axiosErr.response.data.botInviteUrl)
      setChannels([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user && guildId) loadChannels(guildId)
  }, [user, guildId, loadChannels])

  useEffect(() => {
    setStatus(null)
  }, [channelId])

  useEffect(() => {
    if (status?.playbackError) setError(status.playbackError)
  }, [status?.playbackError])

  const playQuery = useCallback(
    async (text: string) => {
      if (!guildId || !channelId || !text.trim()) return
      setBusy('Play')
      setError(null)
      try {
        const res = await discordApi.playMusic(guildId, channelId, text.trim())
        setStatus(res)
        setQuery('')
        await new Promise((r) => setTimeout(r, 2500))
        await refreshQueue(guildId, channelId)
        const latest = await discordApi.getMusicQueue(guildId, channelId)
        setStatus(latest)
        if (latest.playbackError) {
          setError(latest.playbackError)
          showToast({ title: 'Play failed', message: latest.playbackError, variant: 'error', duration: 8000 })
        } else if (latest.nowPlaying) {
          showToast({ title: 'Playing', message: latest.nowPlaying.title, variant: 'success' })
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
        const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Play failed'
        setError(msg)
        showToast({ title: 'Play', message: msg, variant: 'error', duration: 8000 })
      }
      setBusy(null)
    },
    [guildId, channelId, refreshQueue, showToast],
  )

  useEffect(() => {
    if (!user || !guildId || !channelId) return
    refreshQueue(guildId, channelId)
    const timer = setInterval(() => {
      refreshQueue(guildId, channelId)
    }, 10000)
    return () => clearInterval(timer)
  }, [user, guildId, channelId, refreshQueue])

  const selectGuild = (id: string, name: string) => {
    setGuildId(id)
    setChannelId('')
    saveUserPrefs({ guildId: id, guildName: name })
  }

  const runAction = async (action: string, fn: () => Promise<unknown>) => {
    if (!guildId || !channelId) return
    setBusy(action)
    setError(null)
    try {
      const result = await fn()
      if (result && typeof result === 'object' && 'nowPlaying' in result) {
        setStatus(result as MusicQueueStatus)
      }
      showToast({ title: 'Done', message: `${action} succeeded`, variant: 'success' })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.message || `${action} failed`
      setError(msg)
      showToast({ title: action, message: msg, variant: 'error' })
    }
    setBusy(null)
  }

  if (authLoading) {
    return <p className="ios-label px-1">Checking sign-in…</p>
  }

  if (!user) {
    return (
      <div className="page-stack">
        <div className="jukebox-card text-center">
          <CustomAlert variant="info" title="Sign in to use Jukebox">
            Connect your Discord account to queue music in your server&apos;s voice channels.
          </CustomAlert>
          {authError && <p className="ios-label text-red-500 mt-4">{authError}</p>}
          <div className="mt-6 flex justify-center">
            <DiscordSignInButton onClick={login} variant="prominent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack jukebox-page">
      {status?.nowPlaying && status.lavalinkUdpConnected === false && (
        <CustomAlert variant="warning" title="Audio pipeline not ready">
          Voice encryption (DAVE) requires <strong>Lavalink 4.2+</strong>. If you just upgraded, restart Lavalink
          then try <strong>Leave → Join VC → Play</strong> again.
        </CustomAlert>
      )}

      {status?.connected && status.nowPlaying && (
        <CustomAlert variant="info" title="Hear the music in Discord">
          <ol className="list-decimal list-inside space-y-1 mt-2 text-[14px]">
            <li>
              Open Discord (desktop or mobile) and join{' '}
              <strong>{botChannelName ? `#${botChannelName}` : 'the same voice channel'}</strong> as the bot.
            </li>
            <li>Confirm the bot user appears in the channel member list (not just “connected” in this app).</li>
            <li>Unmute the channel and raise Discord’s output volume if needed.</li>
          </ol>
          {listenChannelId && (
            <a
              href={voiceChannelDeepLink(guildId, listenChannelId)}
              target="_blank"
              rel="noreferrer"
              className="block mt-3 text-[#007AFF] underline"
            >
              Open voice channel in Discord
            </a>
          )}
        </CustomAlert>
      )}

      {status?.connected && status.botChannelId && status.channelMatch === false && (
        <CustomAlert variant="warning" title="Wrong voice channel">
          The bot is in a different voice channel than selected. Click <strong>Join VC</strong> again after
          picking the channel you are in on Discord.
        </CustomAlert>
      )}

      {musicReady === false && (
        <CustomAlert variant="warning" title="Music stack offline">
          Start Lavalink locally (see <code className="text-xs">server/lavalink.application.yml.example</code>) and
          ensure <code className="text-xs">BOT_TOKEN</code> is set. Re-invite the bot if it lacks Connect / Speak.
        </CustomAlert>
      )}

      {error && (
        <CustomAlert variant="error" title="Something went wrong">
          {error}
          {botInviteUrl && (
            <a href={botInviteUrl} target="_blank" rel="noreferrer" className="block mt-3 text-[#007AFF] underline">
              Invite Goofy Discord bot to this server
            </a>
          )}
        </CustomAlert>
      )}

      <section>
        <p className="ios-section-title">Server</p>
        {guildsLoading && uniqueGuilds.length === 0 ? (
          <div className="jukebox-card">
            <p className="text-[16px] text-muted text-center">Loading servers…</p>
          </div>
        ) : guildsError ? (
          <div className="jukebox-card">
            <p className="ios-label text-red-500">{guildsError}</p>
          </div>
        ) : (
          <div className="ios-group">
            {uniqueGuilds.map((g) => {
              const icon = guildIconUrl(g, 48)
              const active = g.id === guildId
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`guild-row ${active ? 'guild-row-selected' : ''}`}
                  onClick={() => selectGuild(g.id, g.name)}
                >
                  {icon ? (
                    <img src={icon} alt="" className="guild-avatar" />
                  ) : (
                    <div className="guild-avatar guild-avatar-fallback">{g.name.charAt(0)}</div>
                  )}
                  <div className="guild-meta">
                    <p className="guild-name">{g.name}</p>
                    {g.approximate_member_count != null && (
                      <p className="guild-sub">{g.approximate_member_count.toLocaleString()} members</p>
                    )}
                  </div>
                  {active && <span className="badge badge-success">Selected</span>}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {guildId && selectedGuild && (
        <div className="summary-card">
          <div className="summary-card-icon">{selectedGuild.name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-black truncate">{selectedGuild.name}</p>
            <p className="text-[14px] text-muted mt-1">
              {channels.length} voice channel{channels.length === 1 ? '' : 's'}
              {status?.connected
                ? botChannelName
                  ? ` · bot in #${botChannelName}`
                  : ' · bot in voice'
                : ''}
            </p>
            {status?.connected && listenChannelId && (
              <a
                href={voiceChannelDeepLink(guildId, listenChannelId)}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] text-accent mt-2 inline-block"
              >
                Open {botChannelName ? `#${botChannelName}` : 'voice channel'} in Discord to listen
              </a>
            )}
          </div>
        </div>
      )}

      {guildId && channelId && status?.playbackError && status.playbackError !== dismissedError && (
        <CustomAlert variant="error" title="Playback Error">
          <div className="flex items-center justify-between">
            <span className="text-sm">{status.playbackError}</span>
            <button type="button" onClick={() => setDismissedError(status.playbackError || null)} className="text-[#007AFF] text-sm underline font-semibold ml-4 shrink-0">Dismiss</button>
          </div>
        </CustomAlert>
      )}

      {guildId && (
        <section>
          <p className="ios-section-title">Voice channel</p>
          <div className="jukebox-card">
            {loading ? (
              <p className="text-[16px] text-muted">Loading channels…</p>
            ) : channels.length === 0 ? (
              <p className="text-[15px] text-muted">No voice channels found.</p>
            ) : (
              <label className="jukebox-field-label">
                <span className="ios-label">Channel</span>
                <select
                  className="jukebox-select manage-input"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                >
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.categoryName ? `${ch.categoryName} / ` : ''}
                      {ch.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="btn-row jukebox-btn-row">
              <button
                type="button"
                className="ios-btn-secondary jukebox-action-btn"
                disabled={!channelId || busy !== null}
                onClick={() =>
                  runAction('Join', async () => {
                    const res = await discordApi.joinMusic(guildId, channelId)
                    setStatus(res)
                    return res
                  })
                }
              >
                <Radio className="w-4 h-4" />
                {busy === 'Join' ? 'Joining…' : 'Join VC'}
              </button>
              <button
                type="button"
                className="ios-btn-secondary jukebox-action-btn"
                disabled={!channelId || busy !== null}
                onClick={() =>
                  runAction('Leave', async () => {
                    await discordApi.leaveMusic(guildId, channelId)
                    setStatus({ connected: false, nowPlaying: null, queue: [], paused: false, queueLength: 0, state: 'idle' })
                  })
                }
              >
                <LeaveIcon className="w-4 h-4" />
                {busy === 'Leave' ? 'Leaving…' : 'Leave'}
              </button>
            </div>
          </div>
        </section>
      )}

      {guildId && channelId && (
        <>
          <section>
            <p className="ios-section-title">Play</p>
            <p className="text-[13px] text-muted mb-3 px-1">
              Paste a YouTube URL or search by song name. If a link fails, try the song title instead.
            </p>
            <div className="jukebox-card">
              <div className="jukebox-play-row">
                <input
                  className="ios-input manage-input jukebox-search"
                  placeholder="Song name or YouTube URL"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim() && busy === null) {
                      playQuery(query)
                    }
                  }}
                />
                <button
                  type="button"
                  className="ios-btn-primary jukebox-play-btn"
                  disabled={!query.trim() || busy !== null}
                  onClick={() => playQuery(query)}
                  aria-label="Play"
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    className="ios-btn-secondary py-1.5 px-3 text-xs flex-1 min-w-[100px]"
                    disabled={!query.trim() || busy !== null}
                    onClick={() =>
                      runAction('PlayNext', async () => {
                        const res = await discordApi.playNextMusic(guildId, channelId, query)
                        setStatus(res)
                        setQuery('')
                        return res
                      })
                    }
                  >
                    Play Next
                  </button>
                  <button
                    type="button"
                    className="ios-btn-secondary py-1.5 px-3 text-xs flex-1 min-w-[100px]"
                    disabled={busy !== null || status?.queueLength === 0}
                    onClick={() =>
                      runAction('Shuffle', async () => {
                        const res = await discordApi.shuffleQueue(guildId, channelId)
                        setStatus(res)
                        return res
                      })
                    }
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1" /> Shuffle
                  </button>
                  <button
                    type="button"
                    className="ios-btn-secondary py-1.5 px-3 text-xs flex-1 min-w-[100px]"
                    disabled={busy !== null}
                    onClick={() =>
                      runAction('Clear', async () => {
                        const res = await discordApi.clearQueue(guildId, channelId, true)
                        setStatus(res)
                        return res
                      })
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                  </button>
              </div>

              <div className="flex gap-3 mt-3 items-center justify-between text-sm bg-black/[0.03] p-2 rounded-xl">
                 <div className="flex items-center gap-2">
                     <span className="text-muted font-medium ml-1">Repeat:</span>
                     <select
                       className="jukebox-select manage-input text-xs py-1"
                       value={status?.settings?.repeat || 'off'}
                       onChange={(e) => {
                          runAction('Repeat', async () => {
                             const res = await discordApi.repeatMusic(guildId, channelId, e.target.value as any)
                             setStatus(res)
                             return res
                          })
                       }}
                       disabled={busy !== null}
                     >
                        <option value="off">Off</option>
                        <option value="track">Track</option>
                        <option value="queue">Queue</option>
                     </select>
                 </div>
                 <div className="flex items-center gap-2 mr-1">
                     <label className="flex items-center gap-2 cursor-pointer text-muted font-medium">
                         <input
                           type="checkbox"
                           checked={status?.settings?.autoplay || false}
                           disabled={busy !== null}
                           onChange={(e) => {
                              runAction('Autoplay', async () => {
                                 const res = await discordApi.autoplayMusic(guildId, channelId, e.target.checked)
                                 setStatus(res)
                                 return res
                              })
                           }}
                           className="w-4 h-4 rounded text-[#007AFF] focus:ring-[#007AFF]"
                         />
                         Autoplay
                     </label>
                 </div>
              </div>
            </div>
          </section>

          <section>
            <p className="ios-section-title">Now playing</p>
            <div className="jukebox-card">
              <div className="jukebox-now-head">
                <div className="jukebox-controls">
                  <button
                    type="button"
                    className="jukebox-control-btn"
                    disabled={busy !== null || !status?.connected}
                    onClick={() =>
                      runAction('Skip', async () => {
                        const res = await discordApi.skipMusic(guildId, channelId)
                        setStatus(res)
                        return res
                      })
                    }
                    aria-label="Skip"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="jukebox-control-btn"
                    disabled={busy !== null || !status?.connected}
                    onClick={() =>
                      runAction('Pause', async () => {
                        const res = await discordApi.pauseMusic(guildId, channelId)
                        setStatus(res)
                        return res
                      })
                    }
                    aria-label={status?.paused ? 'Resume' : 'Pause'}
                  >
                    {status?.paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {status?.nowPlaying ? (
                <TrackRow
                  track={status.nowPlaying}
                  label={
                    status.paused
                      ? 'Paused'
                      : status.lavalinkUdpConnected === false
                        ? 'Queued (no audio link)'
                        : status.lavalinkHasTrack
                          ? 'Playing'
                          : 'Starting…'
                  }
                />
              ) : (
                <p className="text-[15px] text-muted leading-relaxed">
                  Nothing playing — join a channel and search for a track.
                </p>
              )}

              {status?.queue && status.queue.length > 0 && (
                <div className="jukebox-queue-block">
                  <p className="ios-section-title jukebox-queue-title">Up next ({status.queueLength})</p>
                  <div className="jukebox-queue">
                    {status.queue.map((track, i) => (
                      <TrackRow
                        key={`${track.encoded}-${i}`}
                        track={track}
                        index={i}
                        onRemove={() => runAction('Remove', async () => {
                            const res = await discordApi.removeTrack(guildId, channelId, i)
                            setStatus(res)
                            return res
                        })}
                        onMoveUp={i > 0 ? () => runAction('MoveUp', async () => {
                            const res = await discordApi.moveTrack(guildId, channelId, i, i - 1)
                            setStatus(res)
                            return res
                        }) : undefined}
                        onMoveDown={i < status.queue.length - 1 ? () => runAction('MoveDown', async () => {
                            const res = await discordApi.moveTrack(guildId, channelId, i, i + 1)
                            setStatus(res)
                            return res
                        }) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
