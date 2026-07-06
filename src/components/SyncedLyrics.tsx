import { useMemo } from 'react'
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
  const lines = useMemo(() => parseLrc(synced), [synced])
  const activeIdx = useMemo(() => activeLrcIndex(lines, positionMs), [lines, positionMs])

  if (lines.length > 0) {
    return (
      <div className="jukebox-lrc-scroll" aria-live="polite">
        {lines.map((line: LrcLine, i: number) => (
          <p
            key={`${line.timeMs}-${i}`}
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
