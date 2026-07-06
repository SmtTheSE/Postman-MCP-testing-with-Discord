import { loadGuildState, saveGuildState } from './stateStore.js'
import { getSessionsForGuild } from './queue.js'
import { emitUpdate } from './service.js' // wait, emitUpdate is not exported.

export function getGuildSettings(guildId) {
    return loadGuildState(guildId)
}

export function setAnnounceChannelId(guildId, channelId) {
    saveGuildState(guildId, { announceChannelId: channelId })
}
