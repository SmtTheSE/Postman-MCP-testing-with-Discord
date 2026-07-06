import { listGuildsViaMcp } from './mcpRunner.js'

const GUILD_CACHE_TTL_MS = 60_000

/** @type {Map<string, { at: number, guilds: object[] }>} */
const cache = new Map()

/** @type {Map<string, Promise<object[]>>} */
const inflight = new Map()

function cacheKey(accessToken, userId) {
  return userId || String(accessToken).slice(0, 24)
}

export async function getUserGuilds(accessToken, userId) {
  const key = cacheKey(accessToken, userId)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < GUILD_CACHE_TTL_MS) {
    return hit.guilds
  }

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = listGuildsViaMcp(accessToken)
    .then((guilds) => {
      cache.set(key, { at: Date.now(), guilds })
      return guilds
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

export function invalidateUserGuilds(accessToken, userId) {
  const key = cacheKey(accessToken, userId)
  cache.delete(key)
  inflight.delete(key)
}
