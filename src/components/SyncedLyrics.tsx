import { useEffect, useMemo, useRef } from 'react'
import { activeLrcIndex, parseLrc, type LrcLine } from '../lib/lrcParser'

export function SyncedLyrics({
  synced,
  plain,
  positionMs = 0,
  paused = false,
}: {
  synced: string | null
  plain: string | null
  positionMs?: number
  paused?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLParagraphElement>(null)
  const lines = useMemo(() => parseLrc(synced), [synced])
  const activeIdx = useMemo(() => activeLrcIndex(lines, positionMs), [lines, positionMs])

  useEffect(() => {
    const container = containerRef.current
    const activeEl = activeLineRef.current
    if (!container || !activeEl || activeIdx < 0) return

    const containerRect = container.getBoundingClientRect()
    const lineRect = activeEl.getBoundingClientRect()
    const lineTop = lineRect.top - containerRect.top + container.scrollTop
    const targetScroll = lineTop - container.clientHeight / 2 + lineRect.height / 2

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: paused ? 'auto' : 'smooth',
    })
  }, [activeIdx, paused])

  if (lines.length > 0) {
    return (
      <div ref={containerRef} className="jukebox-lrc-scroll jukebox-lrc-karaoke" aria-live="polite">
        {lines.map((line: LrcLine, i: number) => (
          <p
            key={`${line.timeMs}-${i}`}
            ref={i === activeIdx ? activeLineRef : undefined}
            className={`jukebox-lrc-line${i === activeIdx ? ' jukebox-lrc-line-active' : ''}${i < activeIdx ? ' jukebox-lrc-line-past' : ''}`}
          >
            {line.text}
          </p>
        ))}
        {paused && <p className="jukebox-lrc-paused">Paused</p>}
      </div>
    )
  }

  if (plain) {
    return <pre className="jukebox-lyrics-text">{plain}</pre>
  }

  return <p className="text-[14px] text-muted">No lyrics found for this track.</p>
}
