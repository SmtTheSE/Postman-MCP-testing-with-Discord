import { requireMusicStack } from './bot.js'

/** @type {Map<string, Set<string>>} */
const votesByTrack = new Map()

function voteKey(guildId, channelId, trackEncoded) {
  return `${guildId}:${channelId}:${trackEncoded}`
}

export function clearVotesForGuild(guildId, channelId) {
  const prefix = `${guildId}:${channelId}:`
  for (const key of votesByTrack.keys()) {
    if (key.startsWith(prefix)) votesByTrack.delete(key)
  }
}

export function resetVotes(guildId, channelId, trackEncoded) {
  if (!trackEncoded) {
    clearVotesForGuild(guildId, channelId)
    return
  }
  votesByTrack.delete(voteKey(guildId, channelId, trackEncoded))
}

export function addVote(guildId, channelId, trackEncoded, userId) {
  const key = voteKey(guildId, channelId, trackEncoded)
  let votes = votesByTrack.get(key)
  if (!votes) {
    votes = new Set()
    votesByTrack.set(key, votes)
  }
  votes.add(String(userId))
  return votes.size
}

export function getVoteCount(guildId, channelId, trackEncoded) {
  return votesByTrack.get(voteKey(guildId, channelId, trackEncoded))?.size ?? 0
}

export function countHumansInVoice(guildId, channelId) {
  const { client } = requireMusicStack()
  const guild = client.guilds.cache.get(guildId)
  const channel = guild?.channels.cache.get(channelId)
  if (!channel || !channel.isVoiceBased?.()) return 0
  return channel.members.filter((m) => !m.user.bot).size
}

export function votesRequired(humanCount) {
  if (humanCount <= 0) return 1
  return Math.floor(humanCount / 2) + 1
}

export function isUserInVoiceChannel(guildId, channelId, userId) {
  const { client } = requireMusicStack()
  const guild = client.guilds.cache.get(guildId)
  const member = guild?.members.cache.get(String(userId))
  return member?.voice?.channelId === String(channelId)
}
