import { runWithUserToken } from './mcpRunner.js'
import { resolveChannelName } from './channelName.js'

export async function createVoiceChannelViaMcp({
  guildId,
  channelName,
  description,
  gameName,
  memberLimit,
  bitrate,
  region,
  accessToken,
  createCategory,
  createTextChannel,
  maxAge,
  maxUses,
}) {
  if (!accessToken) {
    throw Object.assign(new Error('Not authenticated — sign in with Discord first.'), { status: 401 })
  }

  const name = resolveChannelName(channelName, gameName)
  if (!name) {
    throw Object.assign(new Error('Channel name is required. Go back to step 1 and enter a channel name.'), {
      status: 400,
    })
  }

  if (!guildId?.trim()) {
    throw Object.assign(new Error('Select a server on step 3.'), { status: 400 })
  }

  return runWithUserToken(accessToken, async () => {
    const { apiTool: createGuildChannel } = await import(
      '../discord-mcp/tools/pan-mcp/discord-rest-api/create-guild-channel.js'
    )
    const { apiTool: createChannelInvite } = await import(
      '../discord-mcp/tools/pan-mcp/discord-rest-api/create-channel-invite.js'
    )

    const topic = description?.trim() || null

    let categoryId = null
    if (createCategory) {
      const categoryName = (gameName?.trim() || name).toUpperCase()
      try {
        const category = await createGuildChannel.function({
          guild_id: guildId,
          name: categoryName,
          type: 4, // GUILD_CATEGORY
        })
        categoryId = category.id
      } catch (_err) {
        // Continue if category creation fails
      }
    }

    let textChannelId = null
    if (createTextChannel) {
      try {
        const textParams = {
          guild_id: guildId,
          name: name + '-chat',
          type: 0, // GUILD_TEXT
        }
        if (topic) textParams.topic = topic
        if (categoryId) textParams.parent_id = categoryId

        const textChannel = await createGuildChannel.function(textParams)
        textChannelId = textChannel.id
      } catch (_err) {
        // Continue if text channel creation fails
      }
    }

    const channelParams = {
      guild_id: guildId,
      name,
      type: 2,
      bitrate: bitrate || 64000,
      user_limit: memberLimit || 0,
      rtc_region: region || '',
    }
    if (topic) channelParams.topic = topic
    if (categoryId) channelParams.parent_id = categoryId

    let channel
    try {
      channel = await createGuildChannel.function(channelParams)
    } catch (err) {
      const msg = err?.message || ''
      if (topic && msg.includes('CHANNEL_TOPIC_INVALID')) {
        delete channelParams.topic
        channel = await createGuildChannel.function(channelParams)
      } else {
        throw err
      }
    }

    const targetChannelId = textChannelId || channel.id
    let inviteUrl = `https://discord.com/channels/${guildId}/${targetChannelId}`

    try {
      const invite = await createChannelInvite.function({
        channel_id: targetChannelId,
        max_age: maxAge !== undefined ? maxAge : 86400,
        max_uses: maxUses || 0,
      })
      if (invite?.code) {
        inviteUrl = `https://discord.gg/${invite.code}`
      }
    } catch {
      /* use deep link */
    }

    return {
      success: true,
      channel: { id: channel.id, name: channel.name, type: channel.type },
      inviteUrl,
    }
  })
}
