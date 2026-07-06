import { getBotVoiceChannelId, requireMusicStack } from './bot.js'

const AUTO_LEAVE_MS = 2 * 60 * 1000

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const leaveTimers = new Map()

function cancelAutoLeave(guildId) {
  const timer = leaveTimers.get(guildId)
  if (timer) {
    clearTimeout(timer)
    leaveTimers.delete(guildId)
  }
}

function countHumansInChannel(guild, channelId) {
  const channel = guild.channels.cache.get(channelId)
  if (!channel || !channel.isVoiceBased?.()) return 0
  return channel.members.filter((m) => !m.user.bot).size
}

function scheduleAutoLeave(guildId, channelId) {
  cancelAutoLeave(guildId)
  const timer = setTimeout(async () => {
    leaveTimers.delete(guildId)
    try {
      const { leaveVoice } = await import('./service.js')
      await leaveVoice(guildId, channelId)
      console.log(`[music] auto-left empty voice guild=${guildId} channel=${channelId}`)
    } catch (err) {
      console.warn(`[music] auto-leave failed guild=${guildId}:`, err.message)
    }
  }, AUTO_LEAVE_MS)
  leaveTimers.set(guildId, timer)
}

function checkChannelOccupancy(guildId) {
  const { client, shoukaku } = requireMusicStack()
  const channelId = getBotVoiceChannelId(shoukaku, guildId)
  if (!channelId) {
    cancelAutoLeave(guildId)
    return
  }

  const guild = client.guilds.cache.get(guildId)
  if (!guild) return

  const humans = countHumansInChannel(guild, channelId)
  if (humans === 0) {
    scheduleAutoLeave(guildId, channelId)
  } else {
    cancelAutoLeave(guildId)
  }
}

export function attachAutoLeave(client) {
  client.on('voiceStateUpdate', (oldState, newState) => {
    const guildId = newState.guild?.id || oldState.guild?.id
    if (!guildId) return

    try {
      const { shoukaku } = requireMusicStack()
      const botChannelId = getBotVoiceChannelId(shoukaku, guildId)
      if (!botChannelId) return

      const affectedChannel =
        oldState.channelId === botChannelId ||
        newState.channelId === botChannelId

      if (affectedChannel) {
        checkChannelOccupancy(guildId)
      }
    } catch {
      // Bot stack not ready yet
    }
  })

  console.log('[music] auto-leave listener attached (2 min empty channel)')
}
