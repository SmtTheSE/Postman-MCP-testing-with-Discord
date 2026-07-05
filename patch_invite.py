with open('discord-mcp/tools/pan-mcp/discord-rest-api/create-channel-invite.js', 'r') as f:
    content = f.read()

import re

search = """
const executeFunction = async ({ channel_id, max_age = 86400 }) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))
  def.request.body.raw = JSON.stringify({ max_age: Number(max_age) })
  return executeRequest(def, { channel_id, max_age: String(max_age) }, collectionVariables)
}
"""

replace = """
const executeFunction = async ({ channel_id, max_age = 86400, max_uses = 0 }) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))
  def.request.body.raw = JSON.stringify({ max_age: Number(max_age), max_uses: Number(max_uses) })
  return executeRequest(def, { channel_id, max_age: String(max_age), max_uses: String(max_uses) }, collectionVariables)
}
"""

content = content.replace(search.strip(), replace.strip())

search2 = """
          'max_age': {
            type: 'number',
            description: 'The max_age parameter'
          }
        },
        required: ['channel_id', 'max_age']
"""

replace2 = """
          'max_age': {
            type: 'number',
            description: 'The max_age parameter'
          },
          'max_uses': {
            type: 'number',
            description: 'The max_uses parameter'
          }
        },
        required: ['channel_id']
"""

content = content.replace(search2.strip(), replace2.strip())

with open('discord-mcp/tools/pan-mcp/discord-rest-api/create-channel-invite.js', 'w') as f:
    f.write(content)
