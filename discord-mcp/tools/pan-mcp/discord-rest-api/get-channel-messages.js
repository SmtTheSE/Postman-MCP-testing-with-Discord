/**
 * Get messages from a Discord channel. Requires env vars: api_key, base_url, get_channel_messages_auth_apikey_in, get_channel_messages_auth_apikey_key
 */
import { executeRequest } from '../../../lib/postmanExecutor.js'

const requestDefinition = {
  name: 'get channel messages',
  request: {
    method: 'GET',
    url: {
      raw: '{{pan_mcp_base_url}}/channels/:channel_id/messages?limit=<integer>',
      host: ['{{pan_mcp_base_url}}'],
      path: ['channels', ':channel_id', 'messages'],
      query: [{ key: 'limit', value: '<integer>' }],
      variable: [{ key: 'channel_id', value: '<string>' }],
    },
    header: [{ key: 'Accept', value: 'application/json' }],
    body: null,
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

const executeFunction = async ({ channel_id, limit = 10 }) => {
  return executeRequest(requestDefinition, { channel_id, limit: String(limit) }, collectionVariables)
}

export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_channel_messages',
      description: 'Get recent messages from a Discord channel.',
      parameters: {
        type: 'object',
        properties: {
          channel_id: { type: 'string', description: 'Text channel ID' },
          limit: { type: 'number', description: 'Max messages (1-100)' },
        },
        required: ['channel_id'],
      },
    },
  },
}
