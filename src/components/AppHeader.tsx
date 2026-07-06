import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { userAvatarUrl } from '../services/discordApi'
import { DiscordSignInButton } from './DiscordSignInButton'

const CREATE_STEPS = ['New Channel', 'Voice Settings', 'Choose Server'] as const
const FALLBACK_AVATAR = 'https://cdn.discordapp.com/embed/avatars/0.png'

export function AppHeader() {
  const { wizard, user, authLoading, login, logout } = useApp()
  const location = useLocation()
  const isManage = location.pathname === '/manage'
  const isJukebox = location.pathname === '/jukebox'
  const step = wizard.state.step
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)

  const displayName = user?.globalName || user?.username || 'User'
  const resolvedAvatar = user ? avatarSrc ?? userAvatarUrl(user, 64) : FALLBACK_AVATAR

  useEffect(() => {
    setAvatarSrc(null)
  }, [user?.id, user?.avatar])

  const title = isManage ? 'Server Manage' : isJukebox ? 'Jukebox' : CREATE_STEPS[step - 1]

  return (
    <header className="mb-8">
      <div className="header-bar">
        <div className="header-brand">
          <div className="brand-mark" aria-hidden>
            <span className="brand-mark-letter">G</span>
          </div>
          <span className="brand-name truncate">Goofy Discord</span>
        </div>

        <div className="header-actions">
          {authLoading ? (
            <div className="w-[38px] h-[38px] rounded-full bg-white/40 animate-pulse border border-white/50" />
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
            <DiscordSignInButton onClick={login} variant="icon" />
          )}
        </div>
      </div>

      {user && (
        <nav className="app-nav" aria-label="Main">
          <Link to="/" className={`app-nav-link ${!isManage && !isJukebox ? 'app-nav-link-active' : ''}`}>
            Create
          </Link>
          <Link to="/manage" className={`app-nav-link ${isManage ? 'app-nav-link-active' : ''}`}>
            Manage
          </Link>
          <Link to="/jukebox" className={`app-nav-link ${isJukebox ? 'app-nav-link-active' : ''}`}>
            Jukebox
          </Link>
        </nav>
      )}

      <div className="page-title-block">
        <h1 className="ios-large-title">{title}</h1>

        {!isManage && !isJukebox && (
          <div className="step-dots">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`step-dot ${
                  s === step ? 'step-dot-active' : s < step ? 'step-dot-done' : 'step-dot-pending'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
