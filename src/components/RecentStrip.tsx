import { Zap } from 'lucide-react'
import type { RecentChannel } from '../context/AppContext'

interface RecentStripProps {
  channels: RecentChannel[]
  onSelect: (channel: RecentChannel) => void
  onRecreate: (channel: RecentChannel) => void
  isSubmitting: boolean
}

function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function RecentStrip({ channels, onSelect, onRecreate, isSubmitting }: RecentStripProps) {
  if (channels.length === 0) return null

  const items = channels.slice(0, 6)

  return (
    <section className="recent-section" aria-label="Recent channels">
      <p className="ios-section-title">Recent</p>
      <div className="recent-scroll">
        {items.map((ch, index) => (
          <div key={`${ch.id}-${ch.createdAt}-${index}`} className="recent-card-wrap">
            <button type="button" onClick={() => onSelect(ch)} className="recent-card">
              <p className="recent-card-title">{ch.name}</p>
              <p className="recent-card-game">{ch.gameName}</p>
              <p className="recent-card-time">{formatTime(ch.createdAt)}</p>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRecreate(ch)
              }}
              disabled={isSubmitting}
              className="recent-recreate-btn"
              aria-label={`Recreate ${ch.name} instantly`}
              title="Recreate now"
            >
              <Zap className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
