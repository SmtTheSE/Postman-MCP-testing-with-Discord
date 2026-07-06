import { loadGuildState, saveGuildState } from './stateStore.js'

export function getGuildSettings(guildId) {
  return loadGuildState(guildId)
}

export function setAnnounceChannelId(guildId, channelId) {
  saveGuildState(guildId, { announceChannelId: channelId })
}
