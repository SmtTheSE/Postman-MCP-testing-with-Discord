import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { discordApi, guildIconUrl } from '../services/discordApi'
import { Alert } from './ui/Alert'

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

  const hasChannelName = Boolean(channelName.trim() || gameName.trim())
  const displayName = channelName.trim() || gameName.trim()
  const canSubmit = Boolean(guildId && hasChannelName)

  if (authLoading) {
    return (
      <div className="ios-group ios-group-padded text-center">
        <p className="text-[16px] text-[#8E8E93]">Checking Discord session…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-stack">
        {authError && <Alert variant="error">{authError}</Alert>}
        {setupHint && !authError && <Alert variant="warning">{setupHint}</Alert>}

        <section>
          <p className="ios-section-title">Discord sign-in</p>
          <div className="ios-group ios-group-padded text-center space-y-5">
            <div className="space-y-2">
              <p className="text-[17px] font-semibold text-black">Sign in to pick your server</p>
              <p className="text-[15px] text-[#8E8E93] leading-relaxed px-2">
                Your servers load via Postman MCP after OAuth — no manual guild IDs or bot setup needed.
              </p>
            </div>
            <button type="button" onClick={login} className="ios-btn-discord">
              Sign in with Discord
            </button>
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
        <Alert
          variant="warning"
          action={
            <button type="button" onClick={onGoToDetails} className="ios-btn-secondary">
              Enter channel details
            </button>
          }
        >
          Channel name is missing — go back to step 1 first.
        </Alert>
      )}

      {hasChannelName && (
        <div className="summary-card">
          <div className="summary-card-icon">{displayName.charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8E8E93] mb-1">
              Creating
            </p>
            <p className="text-[17px] font-semibold text-black leading-snug break-words">
              {displayName}
            </p>
            {gameName.trim() && channelName.trim() && (
              <p className="text-[14px] text-[#8E8E93] mt-1">{gameName}</p>
            )}
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="ios-section-title !mb-0">Your servers</p>
          <button
            type="button"
            onClick={() => refreshGuilds()}
            disabled={guildsLoading}
            className="ios-btn-ghost !min-h-[32px] !py-1 !px-2 disabled:opacity-40"
          >
            Refresh
          </button>
        </div>

        {guildsError && <Alert variant="error">{guildsError}</Alert>}

        {guildsLoading ? (
          <div className="ios-group ios-group-padded text-center">
            <p className="text-[16px] text-[#8E8E93]">Loading servers…</p>
          </div>
        ) : guilds.length === 0 ? (
          <div className="ios-group ios-group-padded space-y-2">
            <p className="text-[17px] font-semibold text-black">No servers found</p>
            <p className="text-[15px] text-[#8E8E93] leading-relaxed">
              You need Manage Channels or Administrator permission on a Discord server.
            </p>
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
                      {guild.owner && <span>Owner · </span>}
                      {guild.permissions && (
                        <span className="badge badge-success">Can manage</span>
                      )}
                    </p>
                  </div>
                  <div
                    className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-[#007AFF]' : 'border-[#C7C7CC]'
                    }`}
                  >
                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />}
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

      <p className="footnote">Powered by Postman Discord MCP</p>
    </div>
  )
}