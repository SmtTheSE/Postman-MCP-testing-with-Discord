import { listChannelInvites, listGuildInvites, revokeInvite } from './discordBotApi.js'

export async function listChannelInvitesViaMcp(_accessToken, channelId) {
  const result = await listChannelInvites(channelId)
  return Array.isArray(result) ? result : []
}

export async function listGuildInvitesViaMcp(_accessToken, guildId) {
  const result = await listGuildInvites(guildId)
  return Array.isArray(result) ? result : []
}

export async function revokeInviteViaMcp(_accessToken, code) {
  return revokeInvite(code)
}
