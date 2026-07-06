import { PERMISSION, userHasPermission } from '../guildAuth.js'

const MODERATE_MEMBERS = 0x10000000000n

export function userCanManageQueue(guild, { isRequester = false } = {}) {
  if (isRequester) return true
  if (!guild) return false
  const perms = BigInt(guild.permissions || '0')
  if ((perms & PERMISSION.ADMINISTRATOR) !== 0n) return true
  if (userHasPermission(guild.permissions, PERMISSION.MANAGE_CHANNELS)) return true
  if ((perms & MODERATE_MEMBERS) !== 0n) return true
  return false
}

export function assertQueuePermission(guild, options = {}) {
  if (userCanManageQueue(guild, options)) return
  throw Object.assign(new Error('You do not have permission to modify the queue.'), {
    status: 403,
    code: 'INSUFFICIENT_QUEUE_PERMISSION',
  })
}

export function isTrackRequester(session, track) {
  if (!session || !track?.requestedBy) return false
  const name = session.globalName || session.username
  return track.requestedBy === name || track.requestedBy === session.username
}
