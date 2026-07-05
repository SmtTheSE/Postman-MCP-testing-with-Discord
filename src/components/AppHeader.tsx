import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { userAvatarUrl } from '../services/discordApi'

const STEPS = ['New Channel', 'Voice Settings', 'Choose Server'] as const

const FALLBACK_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png'

export function AppHeader() {
  const { wizard, user, authLoading, login, logout } = useApp()
  const step = wizard.state.step
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)

  const displayName = user?.globalName || user?.username || 'User'
  const resolvedAvatar = user ? avatarSrc ?? userAvatarUrl(user, 64) : FALLBACK_AVATAR

  useEffect(() => {
    setAvatarSrc(null)
  }, [user?.id, user?.avatar])

  return (
    <header className="mb-8">
      <div className="header-bar">
        <div className="header-brand">
          <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-[15px] font-bold">V</span>
          </div>
          <span className="text-[17px] font-semibold text-black tracking-tight truncate">VoiceDrop</span>
        </div>

        <div className="header-actions">
          {authLoading ? (
            <div className="w-[38px] h-[38px] rounded-full bg-[#E5E5EA] animate-pulse" />
          ) : user ? (
            <div className="profile-menu">
              <img
                src={resolvedAvatar}
                alt=""
                className="profile-menu-avatar"
                onError={() => setAvatarSrc(FALLBACK_AVATAR)}
              />
              <div className="profile-menu-body">
                <span className="profile-menu-name" title={displayName}>
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="profile-menu-action"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" strokeWidth={2.25} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={login} className="ios-btn-signin">
              Sign in
            </button>
          )}
        </div>
      </div>

      <h1 className="ios-large-title mb-5">{STEPS[step - 1]}</h1>

      <div className="flex items-center justify-center gap-2.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step ? 'w-8 bg-[#007AFF]' : s < step ? 'w-2 bg-[#007AFF]/35' : 'w-2 bg-[#E5E5EA]'
            }`}
          />
        ))}
      </div>
    </header>
  )
}
