import { useCallback, useEffect, useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  discordApi,
  guildIconUrl,
  voiceChannelDeepLink,
  type GuildInvite,
  type VoiceChannel,
} from '../services/discordApi'
import { loadUserPrefs, saveUserPrefs } from '../lib/userPrefs'
import { CustomAlert } from '../components/ui/Alert'
import { DiscordSignInButton } from '../components/DiscordSignInButton'
import { useAlerts } from '../context/AlertContext'

type ManageTab = 'channels' | 'invites'

function formatInviteExpiry(inv: GuildInvite) {
  if (inv.max_age === 0) return 'Never expires'
  if (inv.expires_at) {
    const d = new Date(inv.expires_at)
    return `Expires ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
  }
  return inv.max_age ? `${Math.round(inv.max_age / 3600)}h limit` : 'Active'
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

export function ServerManagePage() {
  const { user, authLoading, authError, login, guilds, guildsLoading, guildsError } = useApp()
  const { showCrud, showToast, confirm } = useAlerts()
  const [guildId, setGuildId] = useState(() => loadUserPrefs().guildId)
  const [tab, setTab] = useState<ManageTab>('channels')
  const [channels, setChannels] = useState<VoiceChannel[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [invites, setInvites] = useState<GuildInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [botInviteUrl, setBotInviteUrl] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLimit, setEditLimit] = useState(0)
  const [editParentId, setEditParentId] = useState('')

  const loadServerData = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    setBotInviteUrl(null)
    setExpandedId(null)

    const errors: string[] = []

    try {
      const channelRes = await discordApi.listVoiceChannels(id)
      setChannels(channelRes.channels)
      setCategories(channelRes.categories)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; botInviteUrl?: string } }
        message?: string
      }
      errors.push(axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to load channels')
      if (axiosErr?.response?.data?.botInviteUrl) {
        setBotInviteUrl(axiosErr.response.data.botInviteUrl)
      }
      setChannels([])
      setCategories([])
    }

    try {
      const inviteRes = await discordApi.listGuildInvites(id)
      setInvites(inviteRes.invites)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; botInviteUrl?: string } }
        message?: string
      }
      errors.push(axiosErr?.response?.data?.error || axiosErr?.message || 'Failed to load invites')
      if (axiosErr?.response?.data?.botInviteUrl) {
        setBotInviteUrl(axiosErr.response.data.botInviteUrl)
      }
      setInvites([])
    }

    if (errors.length) setError([...new Set(errors)].join(' · '))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user && guildId) loadServerData(guildId)
  }, [user, guildId, loadServerData])

  const selectGuild = (id: string, name: string) => {
    setGuildId(id)
    saveUserPrefs({ guildId: id, guildName: name })
  }

  const openEditor = (ch: VoiceChannel) => {
    if (busyId) return
    setExpandedId(ch.id)
    setEditName(ch.name)
    setEditLimit(ch.user_limit ?? 0)
    setEditParentId(ch.parent_id || '')
  }

  const saveChannel = async (channelId: string) => {
    if (busyId) return
    setBusyId(channelId)
    setError(null)
    try {
      await discordApi.updateChannel(channelId, {
        name: editName.trim(),
        user_limit: editLimit,
        parent_id: editParentId || null,
      })
      setExpandedId(null)
      showCrud({
        operation: 'update',
        entity: 'Voice channel',
        success: true,
        detail: `"${editName.trim()}" saved.`,
      })
      await loadServerData(guildId)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Update failed'
      setError(msg)
      showCrud({ operation: 'update', entity: 'Voice channel', success: false, detail: msg })
    } finally {
      setBusyId(null)
    }
  }

  const removeChannel = async (channelId: string, name: string) => {
    if (busyId) return
    const ok = await confirm({
      title: 'Delete voice channel?',
      message: `"${name}" will be permanently removed from the server.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setBusyId(channelId)
    setError(null)
    try {
      await discordApi.deleteChannel(channelId)
      if (expandedId === channelId) setExpandedId(null)
      showCrud({
        operation: 'delete',
        entity: 'Voice channel',
        success: true,
        detail: `"${name}" removed.`,
      })
      await loadServerData(guildId)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Delete failed'
      setError(msg)
      showCrud({ operation: 'delete', entity: 'Voice channel', success: false, detail: msg })
    } finally {
      setBusyId(null)
    }
  }

  const revokeInvite = async (code: string) => {
    if (busyId) return
    setBusyId(code)
    setError(null)
    try {
      await discordApi.revokeInvite(code)
      showCrud({
        operation: 'delete',
        entity: 'Invite',
        success: true,
        detail: 'Invite link is no longer valid.',
      })
      await loadServerData(guildId)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      const msg = axiosErr?.response?.data?.error || axiosErr?.message || 'Revoke failed'
      setError(msg)
      showCrud({ operation: 'delete', entity: 'Invite', success: false, detail: msg })
    } finally {
      setBusyId(null)
    }
  }

  const copyInvite = async (url: string) => {
    await copyText(url)
    showToast({
      variant: 'success',
      title: 'Copied',
      message: 'Invite link copied to clipboard.',
    })
  }

  if (authLoading) {
    return (
      <div className="ios-group ios-group-padded text-center">
        <p className="text-[16px] text-muted">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-stack">
        <section>
          <p className="ios-section-title">Server management</p>
          <div className="ios-group ios-group-padded text-center space-y-4">
            {authError ? (
              <CustomAlert variant="error" title="Sign-in required" message={authError} />
            ) : (
              <p className="text-[15px] text-muted leading-relaxed">
                Sign in to manage voice channels and invites via Postman MCP — one action at a time.
              </p>
            )}
            <DiscordSignInButton onClick={login} variant="prominent" className="w-full" />
          </div>
        </section>
      </div>
    )
  }

  const selectedGuild = guilds.find((g) => g.id === guildId)

  return (
    <div className="page-stack">
      {error && (
        <CustomAlert
          variant="error"
          title="Something went wrong"
          message={error}
          operation="read"
          action={
            <>
              {botInviteUrl && (
                <a
                  href={botInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ios-btn-discord w-full inline-flex justify-center"
                >
                  Add Goofy Discord bot to server
                </a>
              )}
              {!botInviteUrl && (error.includes('sign in again') || error.includes('sign out')) && (
                <DiscordSignInButton
                  onClick={login}
                  variant="prominent"
                  className="w-full"
                  label="Sign in again"
                />
              )}
            </>
          }
        />
      )}
      {guildsError && !error && (
        <CustomAlert variant="error" title="Couldn't load servers" message={guildsError} operation="read" />
      )}

      <section>
        <p className="ios-section-title">Server</p>
        {guildsLoading && guilds.length === 0 ? (
          <div className="ios-group ios-group-padded text-center">
            <p className="text-[16px] text-muted">Loading servers…</p>
          </div>
        ) : (
          <div className="ios-group">
            {guilds.map((guild) => {
              const selected = guildId === guild.id
              const icon = guildIconUrl(guild)
              return (
                <button
                  key={guild.id}
                  type="button"
                  onClick={() => selectGuild(guild.id, guild.name)}
                  className={`guild-row ${selected ? 'guild-row-selected' : ''}`}
                >
                  {icon ? (
                    <img src={icon} alt="" className="guild-avatar" />
                  ) : (
                    <div className="guild-avatar guild-avatar-fallback">{guild.name.charAt(0)}</div>
                  )}
                  <div className="guild-meta">
                    <p className="guild-name">{guild.name}</p>
                    {guild.approximate_member_count != null && (
                      <p className="guild-sub">{guild.approximate_member_count.toLocaleString()} members</p>
                    )}
                  </div>
                  {selected && <span className="badge badge-success">Selected</span>}
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
            <p className="text-[17px] font-semibold text-black">{selectedGuild.name}</p>
            <p className="text-[14px] text-muted mt-1">
              {selectedGuild.approximate_member_count != null &&
                `${selectedGuild.approximate_member_count.toLocaleString()} members`}
              {selectedGuild.approximate_presence_count != null &&
                ` · ${selectedGuild.approximate_presence_count.toLocaleString()} online`}
            </p>
            <p className="text-[13px] text-muted mt-1">
              {channels.length} voice · {invites.length} invites · {categories.length} categories
            </p>
          </div>
        </div>
      )}

      {guildId && (
        <>
          <div className="segmented">
            <button
              type="button"
              onClick={() => setTab('channels')}
              className={`segmented-btn ${tab === 'channels' ? 'segmented-btn-active' : ''}`}
            >
              Voice ({channels.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('invites')}
              className={`segmented-btn ${tab === 'invites' ? 'segmented-btn-active' : ''}`}
            >
              Invites ({invites.length})
            </button>
          </div>

          {loading ? (
            <div className="ios-group ios-group-padded text-center">
              <p className="text-[16px] text-muted">Loading via MCP…</p>
            </div>
          ) : tab === 'channels' ? (
            <section>
              <p className="ios-section-title">Edit one channel at a time</p>
              {channels.length === 0 ? (
                <div className="ios-group ios-group-padded">
                  <p className="text-[15px] text-muted">No voice channels on {selectedGuild?.name || 'this server'}.</p>
                </div>
              ) : (
                <div className="ios-group">
                  {channels.map((ch) => {
                    const isOpen = expandedId === ch.id
                    const isBusy = busyId === ch.id
                    return (
                      <div key={ch.id} className="manage-item">
                        <button
                          type="button"
                          onClick={() => (isOpen ? setExpandedId(null) : openEditor(ch))}
                          disabled={Boolean(busyId && !isBusy)}
                          className="manage-item-head"
                        >
                          <div className="min-w-0 text-left">
                            <p className="text-[16px] font-semibold text-black truncate">{ch.name}</p>
                            <p className="text-[13px] text-muted mt-0.5">
                              {ch.categoryName ? `${ch.categoryName} · ` : ''}
                              {ch.user_limit ? `Limit ${ch.user_limit}` : 'No limit'}
                              {ch.bitrate ? ` · ${Math.round(ch.bitrate / 1000)} kbps` : ''}
                            </p>
                          </div>
                          <span className="text-[13px] text-accent font-medium shrink-0">
                            {isOpen ? 'Close' : 'Edit'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="manage-item-body">
                            <label className="ios-label">Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="ios-input manage-input"
                              disabled={isBusy}
                            />
                            <label className="ios-label mt-3">Member limit (0 = none)</label>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={editLimit}
                              onChange={(e) => setEditLimit(parseInt(e.target.value, 10) || 0)}
                              className="ios-input manage-input"
                              disabled={isBusy}
                            />
                            <label className="ios-label mt-3">Category</label>
                            <select
                              value={editParentId}
                              onChange={(e) => setEditParentId(e.target.value)}
                              className="ios-input manage-input"
                              disabled={isBusy}
                            >
                              <option value="">No category</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <div className="btn-row mt-4">
                              <button
                                type="button"
                                onClick={() => saveChannel(ch.id)}
                                disabled={isBusy || !editName.trim()}
                                className="ios-btn-primary"
                              >
                                {isBusy ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeChannel(ch.id, ch.name)}
                                disabled={isBusy}
                                className="ios-btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => window.open(voiceChannelDeepLink(guildId, ch.id), '_blank')}
                              className="ios-btn-secondary flex items-center justify-center gap-2 mt-3"
                            >
                              <ExternalLink className="w-4 h-4" strokeWidth={2} />
                              Open in Discord
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ) : (
            <section>
              <p className="ios-section-title">Revoke or copy one invite at a time</p>
              {invites.length === 0 ? (
                <div className="ios-group ios-group-padded">
                  <p className="text-[15px] text-muted">No active invites on this server.</p>
                </div>
              ) : (
                <div className="ios-group">
                  {invites.map((inv) => {
                    const isBusy = busyId === inv.code
                    const url = inv.url || `https://discord.gg/${inv.code}`
                    return (
                      <div key={inv.code} className="manage-item">
                        <div className="manage-item-head manage-item-head-static">
                          <div className="min-w-0">
                            <p className="text-[15px] font-mono text-accent truncate">discord.gg/{inv.code}</p>
                            <p className="text-[13px] text-muted mt-1">
                              {inv.channel?.name ? `#${inv.channel.name}` : 'Server invite'}
                              {inv.uses != null && ` · ${inv.uses} uses`}
                              {inv.max_uses ? ` / ${inv.max_uses}` : ''}
                            </p>
                            <p className="text-[12px] text-[#AEAEB2] mt-1">{formatInviteExpiry(inv)}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => copyInvite(url)}
                              disabled={Boolean(busyId)}
                              className="ios-btn-secondary-sm flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => revokeInvite(inv.code)}
                              disabled={Boolean(busyId)}
                              className="ios-btn-danger-sm"
                            >
                              {isBusy ? '…' : 'Revoke'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <p className="footnote">MCP: list_guild_channels · update_channel · delete_channel · list_guild_invites · invite_revoke</p>
    </div>
  )
}
