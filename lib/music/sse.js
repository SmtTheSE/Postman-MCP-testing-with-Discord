/** SSE subscribers and live activity for jukebox sessions */

/** @type {Map<string, Set<import('http').ServerResponse>>} */
const subscribers = new Map()

/** @type {Map<string, Array<object>>} */
const activityLogs = new Map()

export function sessionStreamKey(guildId, channelId) {
  return `${guildId}:${channelId}`
}

export function addSubscriber(guildId, channelId, res) {
  const key = sessionStreamKey(guildId, channelId)
  if (!subscribers.has(key)) subscribers.set(key, new Set())
  subscribers.get(key).add(res)
  res.on('close', () => {
    subscribers.get(key)?.delete(res)
    if (subscribers.get(key)?.size === 0) subscribers.delete(key)
  })
}

function writeEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export function broadcast(guildId, channelId, event, data) {
  const subs = subscribers.get(sessionStreamKey(guildId, channelId))
  if (!subs?.size) return
  for (const res of subs) {
    try {
      writeEvent(res, event, data)
    } catch {
      subs.delete(res)
    }
  }
}

export function broadcastQueueUpdate(guildId, channelId, status) {
  broadcast(guildId, channelId, 'queue_updated', status)
}

export function pushAction(guildId, channelId, log) {
  const key = sessionStreamKey(guildId, channelId)
  const entry = { ...log, at: Date.now() }
  const list = [entry, ...(activityLogs.get(key) || [])].slice(0, 10)
  activityLogs.set(key, list)
  broadcast(guildId, channelId, 'action_log', entry)
}

export function getRecentActivity(guildId, channelId) {
  return activityLogs.get(sessionStreamKey(guildId, channelId)) || []
}
