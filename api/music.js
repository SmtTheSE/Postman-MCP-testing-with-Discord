import { requireDiscordToken } from '../lib/apiAuth.js'
import { assertUserInGuild } from '../lib/guildAuth.js'
import { getSession } from '../lib/session.js'
import * as music from '../lib/music/service.js'
import { getSession as getQueueSession } from '../lib/music/queue.js'
import { assertQueuePermission, isTrackRequester } from '../lib/music/queuePermissions.js'
import { addSubscriber } from '../lib/music/sse.js'
import { getHistory, getUserFavorites, addUserFavorite, removeUserFavorite } from '../lib/music/stateStore.js'
import { setAnnounceChannelId } from '../lib/music/settings.js'

function actorFromSession(session) {
  return {
    userId: session?.userId || '',
    username: session?.globalName || session?.username || 'friend',
  }
}

function playAuth(session, guild) {
  return { userId: session?.userId, guild }
}

function parseIds(body = {}, query = {}) {
  const guildId = body.guildId || query.guild_id
  const channelId = body.channelId || query.channel_id
  if (!guildId || !channelId) {
    throw Object.assign(new Error('guildId and channelId are required'), { status: 400, code: 'INVALID_REQUEST' })
  }
  return { guildId: String(guildId), channelId: String(channelId) }
}

function parseGuildId(body = {}, query = {}) {
  const guildId = body.guildId || query.guild_id
  if (!guildId) {
    throw Object.assign(new Error('guildId is required'), { status: 400, code: 'INVALID_REQUEST' })
  }
  return String(guildId)
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
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playQuery(guildId, channelId, query, requestedBy, false, playAuth(session, guild))
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'added', query)
    return { success: true, ...status }
  })
}

export async function skip(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const qSession = getQueueSession(guildId, channelId)
    assertQueuePermission(guild, { isRequester: isTrackRequester(session, qSession?.nowPlaying) })
    const status = await music.skipTrack(guildId, channelId)
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'skipped')
    return { success: true, ...status }
  })
}

export async function voteSkip(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const result = await music.voteSkipTrack(guildId, channelId, session, guild)
    if (result.voteSkip?.skipped) {
      music.logMusicAction(guildId, channelId, actorFromSession(session), 'vote_skipped')
    } else if (result.voteSkip) {
      music.logMusicAction(
        guildId,
        channelId,
        actorFromSession(session),
        'vote_skip',
        `${result.voteSkip.votes}/${result.voteSkip.needed}`,
      )
    }
    return { success: true, ...result }
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
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const qSession = getQueueSession(guildId, channelId)
    const track = qSession?.tracks?.[index]
    assertQueuePermission(guild, { isRequester: isTrackRequester(session, track) })
    const status = await music.removeTrack(guildId, channelId, index)
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'removed', track?.title)
    return { success: true, ...status }
  })
}

export async function move(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { fromIndex, toIndex } = req.body
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const qSession = getQueueSession(guildId, channelId)
    const track = qSession?.tracks?.[fromIndex]
    assertQueuePermission(guild, { isRequester: isTrackRequester(session, track) })
    const status = await music.moveTrack(guildId, channelId, fromIndex, toIndex)
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'moved', track?.title)
    return { success: true, ...status }
  })
}

export async function clear(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { keepNowPlaying } = req.body
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    assertQueuePermission(guild)
    const status = await music.clearQueue(guildId, channelId, keepNowPlaying)
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'cleared')
    return { success: true, ...status }
  })
}

export async function shuffle(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    assertQueuePermission(guild)
    const status = await music.shuffleQueue(guildId, channelId)
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'shuffled')
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

export async function mood(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { mood: moodValue } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.setMood(guildId, channelId, moodValue)
    return { success: true, ...status }
  })
}

export async function playNext(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { query } = req.body
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playNext(guildId, channelId, query, requestedBy, playAuth(session, guild))
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'play_next', query)
    return { success: true, ...status }
  })
}

export async function stream(req, res) {
  try {
    const accessToken = await requireDiscordToken(req, res)
    if (!accessToken) return

    const session = await getSession(req)
    const guildId = String(req.query?.guild_id || '')
    const channelId = String(req.query?.channel_id || '')
    if (!guildId || !channelId) {
      return res.status(400).json({ error: 'guild_id and channel_id are required', code: 'INVALID_REQUEST' })
    }

    await assertUserInGuild(accessToken, guildId, session?.userId)

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    addSubscriber(guildId, channelId, res)

    const status = await music.getQueueStatus(guildId, channelId)
    res.write(`event: connected\ndata: ${JSON.stringify(status)}\n\n`)

    const heartbeat = setInterval(() => {
      try {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`)
      } catch {
        clearInterval(heartbeat)
      }
    }, 15000)

    req.on('close', () => clearInterval(heartbeat))
  } catch (err) {
    if (!res.headersSent) {
      return res.status(err.status || 500).json({
        error: err.message || 'Stream failed',
        code: err.code,
      })
    }
    res.end()
  }
}

export async function history(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const guildId = String(req.query?.guild_id || req.body?.guildId || '')
    if (!guildId) {
      throw Object.assign(new Error('guild_id is required'), { status: 400, code: 'INVALID_REQUEST' })
    }
    await assertUserInGuild(accessToken, guildId, session?.userId)
    return { success: true, history: getHistory(guildId) }
  })
}

export async function requeueHistory(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { track } = req.body
    if (!track?.encoded) {
      throw Object.assign(new Error('track with encoded field is required'), { status: 400, code: 'INVALID_REQUEST' })
    }
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playExistingTrack(guildId, channelId, track, requestedBy, false, playAuth(session, guild))
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'requeued', track.title)
    return { success: true, ...status }
  })
}

export async function favorites(req, res) {
  if (req.method === 'GET') {
    return withMusicAuth(req, res, async (accessToken, session) => {
      const guildId = parseGuildId(req.body, req.query)
      if (!session?.userId) {
        throw Object.assign(new Error('guild_id is required'), { status: 400, code: 'INVALID_REQUEST' })
      }
      await assertUserInGuild(accessToken, guildId, session.userId)
      return { success: true, favorites: getUserFavorites(guildId, session.userId) }
    })
  }

  if (req.method === 'POST') {
    return withMusicAuth(req, res, async (accessToken, session) => {
      const guildId = parseGuildId(req.body)
      const { track } = req.body
      if (!track?.encoded) {
        throw Object.assign(new Error('track is required'), { status: 400, code: 'INVALID_REQUEST' })
      }
      await assertUserInGuild(accessToken, guildId, session?.userId)
      const list = addUserFavorite(guildId, session.userId, track)
      return { success: true, favorites: list }
    })
  }

  if (req.method === 'DELETE') {
    return withMusicAuth(req, res, async (accessToken, session) => {
      const guildId = parseGuildId(req.body)
      const { encoded } = req.body
      await assertUserInGuild(accessToken, guildId, session?.userId)
      const list = removeUserFavorite(guildId, session.userId, encoded)
      return { success: true, favorites: list }
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export async function playFavorite(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { track } = req.body
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playExistingTrack(guildId, channelId, track, requestedBy, false, playAuth(session, guild))
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'played_favorite', track?.title)
    return { success: true, ...status }
  })
}

export async function playNextFavorite(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { track } = req.body
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.playExistingTrack(guildId, channelId, track, requestedBy, true, playAuth(session, guild))
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'play_next_favorite', track?.title)
    return { success: true, ...status }
  })
}

export async function settingsAnnounce(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const guildId = parseGuildId(req.body)
    const musicChannelId = req.body.musicChannelId || req.body.voiceChannelId
    const announceChannelId = req.body.announceChannelId ?? null
    await assertUserInGuild(accessToken, guildId, session?.userId)
    setAnnounceChannelId(guildId, announceChannelId || null)
    if (musicChannelId) {
      const status = await music.getQueueStatus(guildId, musicChannelId)
      return { success: true, announceChannelId, ...status }
    }
    return { success: true, announceChannelId }
  })
}

export async function karaoke(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { enabled } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.setKaraoke(guildId, channelId, enabled)
    return { success: true, ...status }
  })
}

export async function djRouletteSpin(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.spinDjRoulette(guildId, channelId)
    return { success: true, ...status }
  })
}

export async function djRouletteToggle(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { enabled } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.toggleDjRoulette(guildId, channelId, enabled)
    return { success: true, ...status }
  })
}

export async function soundboardList(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const guildId = req.query?.guild_id ? String(req.query.guild_id) : null
    if (guildId) await assertUserInGuild(accessToken, guildId, session?.userId)
    return { success: true, sounds: music.getSoundboardList(guildId) }
  })
}

export async function soundboardUpload(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const guildId = parseGuildId(req.body)
    const { label, filename, dataBase64, maxMs } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const sound = await music.uploadSoundboardClip(guildId, { label, filename, dataBase64, maxMs })
    music.logMusicAction(guildId, channelIdFromBody(req.body), actorFromSession(session), 'uploaded sound', sound.label)
    return { success: true, sound, sounds: music.getSoundboardList(guildId) }
  })
}

function channelIdFromBody(body) {
  return body.musicChannelId || body.channelId || ''
}

export async function soundboardDelete(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const guildId = parseGuildId(req.body)
    const { soundId } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    await music.deleteSoundboardClip(guildId, soundId)
    return { success: true, sounds: music.getSoundboardList(guildId) }
  })
}

export async function moodPlaylists(req, res) {
  return withMusicAuth(req, res, async () => {
    return { success: true, playlists: music.getMoodPlaylistCatalog() }
  })
}

export async function moodPlaylistQueue(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { playlistId } = req.body
    const guild = await assertUserInGuild(accessToken, guildId, session?.userId)
    const requestedBy = session?.globalName || session?.username || 'friend'
    const status = await music.queueMoodPlaylist(guildId, channelId, playlistId, requestedBy, playAuth(session, guild))
    return { success: true, ...status }
  })
}

export async function soundboardPlay(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body)
    const { soundId } = req.body
    await assertUserInGuild(accessToken, guildId, session?.userId)
    const status = await music.playSoundboardClip(guildId, channelId, soundId)
    music.logMusicAction(guildId, channelId, actorFromSession(session), 'soundboard', soundId)
    return { success: true, ...status }
  })
}

export async function lyrics(req, res) {
  return withMusicAuth(req, res, async (accessToken, session) => {
    const { guildId, channelId } = parseIds(req.body, req.query)
    await assertUserInGuild(accessToken, guildId, session?.userId)
    return music.getLyrics(guildId, channelId)
  })
}
