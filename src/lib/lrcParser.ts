export interface LrcLine {
  timeMs: number
  text: string
}

const LRC_TIME = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g

export function parseLrc(synced: string | null | undefined): LrcLine[] {
  if (!synced?.trim()) return []

  const lines: LrcLine[] = []
  for (const rawLine of synced.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    const times: number[] = []
    let match
  LRC_TIME.lastIndex = 0
    while ((match = LRC_TIME.exec(line)) !== null) {
      const mins = Number(match[1])
      const secs = Number(match[2])
      const frac = match[3] ? Number(match[3].padEnd(3, '0')) : 0
      times.push(mins * 60_000 + secs * 1000 + frac)
    }

    const text = line.replace(LRC_TIME, '').trim()
    if (!text || times.length === 0) continue

    for (const timeMs of times) {
      lines.push({ timeMs, text })
    }
  }

  return lines.sort((a, b) => a.timeMs - b.timeMs)
}

export function activeLrcIndex(lines: LrcLine[], positionMs: number): number {
  if (!lines.length) return -1
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].timeMs <= positionMs) idx = i
    else break
  }
  return idx
}
