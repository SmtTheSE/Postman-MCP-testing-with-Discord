import { Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { loadUserPrefs } from '../lib/userPrefs'
import { withTimeSuffix } from '../lib/channelNaming'

export function QuickDropCard() {
  const { user, quickDrop, isSubmitting, result } = useApp()
  const prefs = loadUserPrefs()

  if (!user || result || !prefs.guildId) return null

  const game = prefs.lastGameName || 'Gaming'
  const channelPreview = withTimeSuffix(prefs.lastGameName || 'voice')

  return (
    <section className="quick-drop-section" aria-label="Goofy drop">
      <button
        type="button"
        onClick={() => quickDrop()}
        disabled={isSubmitting}
        className="quick-drop-card"
      >
        <div className="quick-drop-icon">
          <Zap className="w-6 h-6" strokeWidth={2.2} />
        </div>
        <div className="quick-drop-body">
          <p className="quick-drop-title">{isSubmitting ? 'Creating…' : 'Goofy Drop'}</p>
          <p className="quick-drop-sub">
            {game} on <strong>{prefs.guildName}</strong>
          </p>
          <p className="quick-drop-hint">#{channelPreview} · text chat · invite copied after</p>
        </div>
      </button>
    </section>
  )
}
