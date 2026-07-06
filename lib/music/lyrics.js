const LRCLIB_SEARCH = 'https://lrclib.net/api/search'

function cleanTitle(title = '') {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchLyricsForTrack(track) {
  if (!track?.title) {
    return { found: false, plain: null, synced: null }
  }

  const trackName = cleanTitle(track.title)
  const artistName = cleanTitle(track.author || '')

  const params = new URLSearchParams({ track_name: trackName })
  if (artistName) params.set('artist_name', artistName)

  try {
    const res = await fetch(`${LRCLIB_SEARCH}?${params}`, {
      headers: { 'User-Agent': 'GoofyDiscord-Jukebox/1.0' },
    })
    if (!res.ok) {
      return { found: false, plain: null, synced: null }
    }

    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) {
      return { found: false, plain: null, synced: null }
    }

    const match = results[0]
    return {
      found: Boolean(match.plainLyrics || match.syncedLyrics),
      plain: match.plainLyrics || null,
      synced: match.syncedLyrics || null,
      source: 'lrclib',
    }
  } catch (err) {
    console.warn('[lyrics] fetch failed:', err.message)
    return { found: false, plain: null, synced: null, error: err.message }
  }
}
