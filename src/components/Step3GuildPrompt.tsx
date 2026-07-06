import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { discordApi, guildIconUrl } from '../services/discordApi'
import { loadUserPrefs } from '../lib/userPrefs'
import { CustomAlert } from './ui/Alert'
import { DiscordSignInButton } from './DiscordSignInButton'

interface Step3Props {
  guildId: string
  channelName: string
  gameName: string
  onSelectGuild: (id: string, name: string) => void
  onBack: () => void
  onGoToDetails: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function Step3GuildPrompt({
  guildId,
  channelName,
  gameName,
  onSelectGuild,
  onBack,
  onGoToDetails,
  onSubmit,
  isSubmitting,
}: Step3Props) {
  const { user, authLoading, login, guilds, guildsLoading, guildsError, refreshGuilds, authError } =
    useApp()
  const [setupHint, setSetupHint] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user && !authLoading) {
      discordApi
        .getAuthStatus()
        .then((s) => {
          if (!s.ready && s.message) setSetupHint(s.message)
          else setSetupHint(null)
        })
        .catch(() => {})
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!guildId && guilds.length > 0) {
      const prefs = loadUserPrefs()
      const match = guilds.find((g) => g.id === prefs.guildId)
      if (match) onSelectGuild(match.id, match.name)
    }
  }, [guildId, guilds, onSelectGuild])

  const filteredGuilds = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return guilds
    return guilds.filter((g) => g.name.toLowerCase().includes(q))
  }, [guilds, search])

  const hasChannelName = Boolean(channelName.trim() || gameName.trim())
  const displayName = channelName.trim() || gameName.trim()
  const canSubmit = Boolean(guildId && hasChannelName)

  if (authLoading) {
    return (
      <div className="ios-group ios-group-padded text-center">
        <p className="text-[16px] text-muted">Checking Discord session…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-stack">
        {authError && (
          <CustomAlert variant="error" title="Sign-in required" message={authError} />
        )}
        {setupHint && !authError && (
          <CustomAlert variant="warning" title="Setup needed" message={setupHint} />
        )}

        <section>
          <p className="ios-section-title">Discord sign-in</p>
          <div className="ios-group ios-group-padded text-center space-y-5">
            <div className="space-y-2">
              <p className="text-[17px] font-semibold text-black">Sign in to pick your server</p>
              <p className="text-[15px] text-muted leading-relaxed px-2">
                One-time sign-in — your servers load automatically. No bot setup.
              </p>
            </div>
            <DiscordSignInButton onClick={login} variant="prominent" className="w-full" />
          </div>
        </section>

        <div className="btn-stack">
          <button type="button" onClick={onBack} className="ios-btn-secondary">
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      {!hasChannelName && (
        <CustomAlert
          variant="warning"
          title="Channel name missing"
          message="Go back to step 1 and enter a channel name first."
          action={
            <button type="button" onClick={onGoToDetails} className="ios-btn-secondary">
              Enter channel details
            </button>
          }
        />
      )}

      {hasChannelName && (
        <div className="summary-card">
          <div className="summary-card-icon">{displayName.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted mb-1">
              Creating
            </p>
            <p className="text-[17px] font-semibold text-black leading-snug break-words">
              {displayName}
            </p>
            {gameName.trim() && channelName.trim() && (
              <p className="text-[14px] text-muted mt-1">{gameName}</p>
            )}
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="ios-section-title !mb-0">Your servers</p>
          <button
            type="button"
            onClick={() => refreshGuilds({ force: true })}
            disabled={guildsLoading}
            className="ios-btn-ghost !min-h-[32px] !py-1 !px-2 disabled:opacity-40"
          >
            Refresh
          </button>
        </div>

        {guilds.length > 5 && (
          <div className="ios-group mb-3">
            <div className="ios-group-row flex items-center gap-2">
              <Search className="w-4 h-4 text-muted shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search servers…"
                className="ios-input"
              />
            </div>
          </div>
        )}

        {guildsError && (
          <CustomAlert variant="error" title="Couldn't load servers" message={guildsError} operation="read" />
        )}

        {guildsLoading ? (
          <div className="ios-group ios-group-padded text-center">
            <p className="text-[16px] text-muted">Loading servers…</p>
          </div>
        ) : guilds.length === 0 ? (
          <div className="ios-group ios-group-padded space-y-2">
            <p className="text-[17px] font-semibold text-black">No servers found</p>
            <p className="text-[15px] text-muted leading-relaxed">
              You need Manage Channels or Administrator permission on a Discord server.
            </p>
          </div>
        ) : filteredGuilds.length === 0 ? (
          <div className="ios-group ios-group-padded">
            <p className="text-[15px] text-muted">No servers match “{search}”</p>
          </div>
        ) : (
          <div className="ios-group">
            {filteredGuilds.map((guild) => {
              const selected = guildId === guild.id
              const icon = guildIconUrl(guild)
              const isLastUsed = loadUserPrefs().guildId === guild.id
              return (
                <button
                  key={guild.id}
                  type="button"
                  onClick={() => onSelectGuild(guild.id, guild.name)}
                  className={`guild-row ${selected ? 'guild-row-selected' : ''}`}
                >
                  {icon ? (
                    <img src={icon} alt="" className="guild-avatar" />
                  ) : (
                    <div className="guild-avatar guild-avatar-fallback">{guild.name.charAt(0)}</div>
                  )}
                  <div className="guild-meta">
                    <p className="guild-name">{guild.name}</p>
                    <p className="guild-sub">
                      {isLastUsed && <span className="badge badge-muted">Last used · </span>}
                      {guild.owner && <span>Owner · </span>}
                      {guild.permissions && (
                        <span className="badge badge-success">Can manage</span>
                      )}
                    </p>
                  </div>
                  <div className={`guild-radio ${selected ? 'guild-radio-selected' : ''}`}>
                    {selected && <div className="guild-radio-dot" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <div className="btn-stack">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="ios-btn-primary"
        >
          {isSubmitting ? 'Creating…' : 'Create Channel'}
        </button>
        <button type="button" onClick={onBack} disabled={isSubmitting} className="ios-btn-secondary">
          Back
        </button>
      </div>
    </div>
  )
}
