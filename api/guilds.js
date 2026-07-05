import { filterManageableGuilds, formatRateLimitError, isRateLimitError } from '../lib/discordOAuth.js'
import { listGuildsViaMcp } from '../lib/mcpRunner.js'
import { getSession } from '../lib/session.js'

const GUILD_CACHE_TTL_MS = 30_000
const guildCache = new Map()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getSession(req)
    if (!session?.accessToken) {
      return res.status(401).json({ error: 'Sign in with Discord first' })
    }

    const cacheKey = session.userId || session.accessToken.slice(0, 16)
    const cached = guildCache.get(cacheKey)
    if (cached && Date.now() - cached.at < GUILD_CACHE_TTL_MS) {
      return res.status(200).json(cached.payload)
    }

    const guilds = await listGuildsViaMcp(session.accessToken)
    const manageable = filterManageableGuilds(guilds)
    const seen = new Set()
    const unique = manageable.filter((g) => {
      if (seen.has(g.id)) return false
      seen.add(g.id)
      return true
    })

    const enriched = unique.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      owner: g.owner,
      permissions: g.permissions,
    }))

    const payload = {
      guilds: enriched,
      total: guilds.length,
      manageable: enriched.length,
    }
    guildCache.set(cacheKey, { at: Date.now(), payload })

    res.status(200).json(payload)
  } catch (err) {
    console.error('Guild list error:', err)
    const message = err.message || 'Failed to list guilds via Postman MCP'
    res.status(isRateLimitError(message) ? 429 : err.status || 500).json({
      error: isRateLimitError(message) ? formatRateLimitError(message) : message,
      details: err.details,
    })
  }
}