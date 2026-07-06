import {
  listGuildChannels,
  getChannel,
  updateChannel,
  deleteChannel,
} from './discordBotApi.js'

export async function listGuildChannelsViaMcp(_accessToken, guildId) {
  const result = await listGuildChannels(guildId)
  return Array.isArray(result) ? result : []
}

export async function getChannelViaMcp(_accessToken, channelId) {
  return getChannel(channelId)
}

export async function updateChannelViaMcp(_accessToken, channelId, updates) {
  return updateChannel(channelId, updates)
}

export async function deleteChannelViaMcp(_accessToken, channelId) {
  return deleteChannel(channelId)
}
