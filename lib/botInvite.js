/** View + Connect + Speak + Manage Channels + Manage Server + Create Invite */
const BOT_PERMISSIONS = 1 + 16 + 32 + 1024 + 1048576 + 2097152

export function buildBotInviteUrl(clientId, guildId) {
  if (!clientId) return null
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: String(BOT_PERMISSIONS),
    scope: 'bot applications.commands',
  })
  if (guildId) params.set('guild_id', guildId)
  return `https://discord.com/api/oauth2/authorize?${params}`
}
