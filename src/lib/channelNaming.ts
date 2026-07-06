/** Append HHMM so repeated sessions don't collide on the same server. */
export function withTimeSuffix(base: string): string {
  const slug = base
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 88)

  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return slug ? `${slug}-${hh}${mm}` : `voice-${hh}${mm}`
}

export function buildShareMessage(channelName: string, gameName: string, inviteUrl: string) {
  const title = channelName.trim() || gameName.trim() || 'Voice channel'
  const game = gameName.trim()
  if (game && game !== title) {
    return `Join ${title} (${game}) — voice:\n${inviteUrl}`
  }
  return `Join ${title} — voice:\n${inviteUrl}`
}
