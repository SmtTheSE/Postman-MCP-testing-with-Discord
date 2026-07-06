/**
 * Create a message in a Discord channel.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js'

const requestDefinition = {
  name: 'create message',
  request: {
    method: 'POST',
    url: {
      raw: '{{pan_mcp_base_url}}/channels/:channel_id/messages',
      host: ['{{pan_mcp_base_url}}'],
      path: ['channels', ':channel_id', 'messages'],
      variable: [{ key: 'channel_id', value: '<string>' }],
    },
    header: [
      { key: 'Accept', value: 'application/json' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    body: {
      mode: 'raw',
      raw: '{{body}}'
    },
    auth: {
      type: 'apikey',
      apikey: [
        { key: 'key', value: '{{pan_mcp_get_channel_messages_auth_apikey_key}}', type: 'string' },
        { key: 'value', value: '{{pan_mcp_api_key}}', type: 'string' },
        { key: 'in', value: '{{pan_mcp_get_channel_messages_auth_apikey_in}}', type: 'string' },
      ],
    },
  },
}

const collectionVariables = [
  { key: 'baseUrl', value: 'https://discord.com/api/v10' },
  { key: 'BOT_TOKEN', value: 'YOUR BOT USER TOKEN' },
  { key: 'USER_TOKEN', value: 'YOUR USER BEARER TOKEN' },
]

const executeFunction = async ({ channel_id, content, embeds }) => {
  const body = {}
  if (content) body.content = content
  if (embeds) body.embeds = embeds

  const def = JSON.parse(JSON.stringify(requestDefinition))
  def.request.body.raw = JSON.stringify(body)

  return executeRequest(def, { channel_id }, collectionVariables)
}

export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_message',
      description: 'Create a message in a Discord channel.',
      parameters: {
        type: 'object',
        properties: {
          channel_id: { type: 'string', description: 'Text channel ID' },
          content: { type: 'string', description: 'Message content' },
          embeds: { type: 'array', description: 'Array of embed objects' }
        },
        required: ['channel_id'],
      },
    },
  },
}
