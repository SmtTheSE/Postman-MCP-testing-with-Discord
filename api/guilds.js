import { filterManageableGuilds, formatDiscordApiError, formatRateLimitError, isRateLimitError } from '../lib/discordOAuth.js'
import { requireDiscordToken } from '../lib/apiAuth.js'
import { getUserGuilds } from '../lib/guildListCache.js'
import { getSession } from '../lib/session.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const accessToken = await requireDiscordToken(req, res)
    const session = await getSession(req)

    const guilds = await getUserGuilds(accessToken, session?.userId)
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
      approximate_member_count: g.approximate_member_count,
      approximate_presence_count: g.approximate_presence_count,
    }))

    const payload = {
      guilds: enriched,
      total: guilds.length,
      manageable: enriched.length,
    }

    res.status(200).json(payload)
  } catch (err) {
    console.error('Guild list error:', err)
    const raw = err.message || 'Failed to list guilds via Postman MCP'
    const message = formatDiscordApiError(raw, err.code)
    const isRL = isRateLimitError(raw)
    res.status(isRL ? 429 : err.status || 500).json({
      error: isRL ? formatRateLimitError(raw) : message,
      code: err.code,
      details: err.details,
    })
  }
}
