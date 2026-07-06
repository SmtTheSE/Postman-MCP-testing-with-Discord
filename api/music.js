import { requireDiscordToken } from '../lib/apiAuth.js'
import { assertUserInGuild } from '../lib/guildAuth.js'
import { getSession } from '../lib/session.js'
import * as music from '../lib/music/service.js'

function parseIds(body = {}, query = {}) {
  const guildId = body.guildId || query.guild_id
  const channelId = body.channelId || query.channel_id
  if (!guildId || !channelId) {
    throw Object.assign(new Error('guildId and channelId are required'), { status: 400, code: 'INVALID_REQUEST' })
  }
  return { guildId: String(guildId), channelId: String(channelId) }
}

async function withMusicAuth(req, res, handler) {
  try {
    const accessToken = await requireDiscordToken(req, res)
    const session = await getSession(req)
    const result = await handler(accessToken, session)
    return res.status(200).json(result)
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Music operation failed',
      code: err.code,
    })
  }
}

export async function join(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.joinVoice(guildId, channelId)
    return { success: true, ...status }
  })
}

export async function play(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { query } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playQuery(guildId, channelId, query, requestedBy)
    return { success: true, ...status }
  })
}

export async function skip(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.skipTrack(guildId, channelId)
    return { success: true, ...status }
  })
}

export async function pause(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.togglePause(guildId, channelId)
    return { success: true, ...status }
  })
}

export async function leave(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    return music.leaveVoice(guildId, channelId)
  })
}

export async function queue(req, res) {
  return withMusicAuth(req, res, async () => {
    const { guildId, channelId } = parseIds(req.body, req.query)
    return music.getQueueStatus(guildId, channelId)
  })
}

export async function remove(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { index } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.removeTrack(guildId, channelId, index)
    return { success: true, ...status }
  })
}

export async function move(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { fromIndex, toIndex } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.moveTrack(guildId, channelId, fromIndex, toIndex)
    return { success: true, ...status }
  })
}

export async function clear(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { keepNowPlaying } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.clearQueue(guildId, channelId, keepNowPlaying)
    return { success: true, ...status }
  })
}

export async function shuffle(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.shuffleQueue(guildId, channelId)
    return { success: true, ...status }
  })
}

export async function repeat(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { mode } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.setRepeatMode(guildId, channelId, mode)
    return { success: true, ...status }
  })
}

export async function autoplay(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { enabled } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.setAutoplay(guildId, channelId, enabled)
    return { success: true, ...status }
  })
}

export async function playNext(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { query } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playNext(guildId, channelId, query, requestedBy)
    return { success: true, ...status }
  })
}
