import type { RecentChannel } from '../context/AppContext'

interface RecentStripProps {
  channels: RecentChannel[]
  onSelect: (channel: RecentChannel) => void
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

export function RecentStrip({ channels, onSelect }: RecentStripProps) {
  if (channels.length === 0) return null

  const items = channels.slice(0, 6)

  return (
    <section className="recent-section" aria-label="Recent channels">
      <p className="ios-section-title">Recent</p>
      <div className="recent-scroll">
        {items.map((ch, index) => (
          <button
            key={`${ch.id}-${ch.createdAt}-${index}`}
            type="button"
            onClick={() => onSelect(ch)}
            className="recent-card"
          >
            <p className="recent-card-title">{ch.name}</p>
            <p className="recent-card-game">{ch.gameName}</p>
            <p className="recent-card-time">{formatTime(ch.createdAt)}</p>
          </button>
        ))}
      </div>
    </section>
  )
}
