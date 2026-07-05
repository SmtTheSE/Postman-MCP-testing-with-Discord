/** Discord voice channel names: lowercase, hyphens, 1–100 chars */
export function sanitizeDiscordChannelName(raw, fallback = 'voice-channel') {
  let s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!s) {
    s = String(fallback ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  if (!s) s = 'voice-channel'
  return s.slice(0, 100)
}

export function resolveChannelName(channelName, gameName) {
  const trimmed = String(channelName ?? '').trim()
  if (trimmed) return sanitizeDiscordChannelName(trimmed)
  if (gameName?.trim()) return sanitizeDiscordChannelName(gameName)
  return null
}
