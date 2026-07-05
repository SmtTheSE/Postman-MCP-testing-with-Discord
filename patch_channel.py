with open('discord-mcp/tools/pan-mcp/discord-rest-api/create-guild-channel.js', 'r') as f:
    content = f.read()

import re

search = """
const executeFunction = async ({
  guild_id,
  name,
  type = 2,
  topic,
  bitrate = 64000,
  user_limit = 0,
  rtc_region = '',
}) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))

  const body = {
    name,
    type: Number(type),
    bitrate: Number(bitrate),
    user_limit: Number(user_limit),
  }

  const topicText = topic != null ? String(topic).trim() : ''
  if (topicText) body.topic = topicText.slice(0, 1024)

  const region = rtc_region != null ? String(rtc_region).trim() : ''
  if (region) body.rtc_region = region

  def.request.body.raw = JSON.stringify(body)

  return executeRequest(
    def,
    {
      guild_id,
      name,
      type: String(type),
      bitrate: String(bitrate),
      user_limit: String(user_limit),
    },
    collectionVariables,
  )
}
"""

replace = """
const executeFunction = async ({
  guild_id,
  name,
  type = 2,
  topic,
  bitrate = 64000,
  user_limit = 0,
  rtc_region = '',
  parent_id = '',
}) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))

  const body = {
    name,
    type: Number(type),
  }

  if (Number(type) === 2) {
    body.bitrate = Number(bitrate)
    body.user_limit = Number(user_limit)
    const region = rtc_region != null ? String(rtc_region).trim() : ''
    if (region) body.rtc_region = region
  }

  const topicText = topic != null ? String(topic).trim() : ''
  if (topicText && Number(type) !== 4) body.topic = topicText.slice(0, 1024)

  const parent = parent_id != null ? String(parent_id).trim() : ''
  if (parent) body.parent_id = parent

  def.request.body.raw = JSON.stringify(body)

  return executeRequest(
    def,
    {
      guild_id,
      name,
      type: String(type),
    },
    collectionVariables,
  )
}
"""

content = content.replace(search.strip(), replace.strip())

search2 = """
          type: { type: 'number', description: '2=voice, 0=text', default: 2 },
          topic: { type: 'string', description: 'Channel topic' },
          bitrate: { type: 'number', description: 'Voice bitrate', default: 64000 },
          user_limit: { type: 'number', description: 'Max members, 0=unlimited', default: 0 },
          rtc_region: { type: 'string', description: 'Voice region (optional)' },
"""

replace2 = """
          type: { type: 'number', description: '2=voice, 0=text, 4=category', default: 2 },
          topic: { type: 'string', description: 'Channel topic' },
          bitrate: { type: 'number', description: 'Voice bitrate', default: 64000 },
          user_limit: { type: 'number', description: 'Max members, 0=unlimited', default: 0 },
          rtc_region: { type: 'string', description: 'Voice region (optional)' },
          parent_id: { type: 'string', description: 'Category ID (optional)' },
"""

content = content.replace(search2.strip(), replace2.strip())

with open('discord-mcp/tools/pan-mcp/discord-rest-api/create-guild-channel.js', 'w') as f:
    f.write(content)
