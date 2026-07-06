import { requireMusicStack } from './bot.js'
import { loadGuildState, saveGuildState } from './stateStore.js'
import { userCanManageQueue } from './queuePermissions.js'

export function getDjState(guildId) {
  const state = loadGuildState(guildId)
  return {
    enabled: Boolean(state.djRouletteEnabled),
    userId: state.currentDjUserId || null,
    username: state.currentDjUsername || null,
  }
}

export function listHumansInVoice(guildId, channelId) {
  const { client } = requireMusicStack()
  const guild = client.guilds.cache.get(guildId)
  const channel = guild?.channels.cache.get(channelId)
  if (!channel || !channel.isVoiceBased?.()) return []
  return [...channel.members.filter((m) => !m.user.bot).values()]
}

export function spinDj(guildId, channelId) {
  const humans = listHumansInVoice(guildId, channelId)
  if (!humans.length) {
    throw Object.assign(new Error('No listeners in the voice channel to pick a DJ'), {
      status: 400,
      code: 'NO_LISTENERS',
    })
  }

  const pick = humans[Math.floor(Math.random() * humans.length)]
  const username = pick.displayName || pick.user.globalName || pick.user.username
  saveGuildState(guildId, {
    djRouletteEnabled: true,
    currentDjUserId: pick.id,
    currentDjUsername: username,
  })

  return { userId: pick.id, username }
}

export function setDjRouletteEnabled(guildId, enabled) {
  const updates = { djRouletteEnabled: Boolean(enabled) }
  if (!enabled) {
    updates.currentDjUserId = null
    updates.currentDjUsername = null
  }
  saveGuildState(guildId, updates)
  return getDjState(guildId)
}

export function maybeRotateDj(guildId, channelId) {
  const state = loadGuildState(guildId)
  if (!state.djRouletteEnabled) return null
  try {
    return spinDj(guildId, channelId)
  } catch {
    return null
  }
}

export function assertDjCanQueue(guildId, userId, username, guild) {
  const state = loadGuildState(guildId)
  if (!state.djRouletteEnabled) return

  if (userCanManageQueue(guild)) return
  if (state.currentDjUserId && String(state.currentDjUserId) === String(userId)) return
  if (state.currentDjUsername && state.currentDjUsername === username) return

  const djName = state.currentDjUsername || 'the current DJ'
  throw Object.assign(new Error(`DJ Roulette is on — only ${djName} can queue right now`), {
    status: 403,
    code: 'DJ_ROULETTE_LOCKED',
  })
}
