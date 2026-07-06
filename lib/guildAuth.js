import { getUserGuilds } from './guildListCache.js'

export const PERMISSION = {
  ADMINISTRATOR: 8n,
  MANAGE_CHANNELS: 16n,
  MANAGE_GUILD: 32n,
}

export function userHasPermission(permissions, flag) {
  const perms = BigInt(permissions || '0')
  if ((perms & PERMISSION.ADMINISTRATOR) !== 0n) return true
  return (perms & flag) !== 0n
}

async function findUserGuild(accessToken, guildId, userId) {
  const guilds = await getUserGuilds(accessToken, userId)
  return guilds.find((g) => g.id === guildId) || null
}

export async function assertUserGuildAccess(accessToken, guildId, requiredFlag, permissionLabel, userId) {
  const guild = await findUserGuild(accessToken, guildId, userId)

  if (!guild) {
    throw Object.assign(
      new Error('You cannot manage this server — pick one from your list where you have channel permissions.'),
      { status: 403, code: 'GUILD_NOT_ACCESSIBLE' },
    )
  }

  if (!userHasPermission(guild.permissions, requiredFlag)) {
    throw Object.assign(new Error(`You need ${permissionLabel} on ${guild.name}.`), {
      status: 403,
      code: 'MISSING_USER_PERMISSION',
    })
  }

  return guild
}

/** Any guild the signed-in user is a member of (for jukebox / social features). */
export async function assertUserInGuild(accessToken, guildId, userId) {
  const guild = await findUserGuild(accessToken, guildId, userId)

  if (!guild) {
    throw Object.assign(new Error('You are not a member of this server.'), {
      status: 403,
      code: 'GUILD_NOT_ACCESSIBLE',
    })
  }

  return guild
}
