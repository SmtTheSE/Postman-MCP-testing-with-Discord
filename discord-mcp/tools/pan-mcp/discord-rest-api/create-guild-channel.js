/**
 * Create a new channel in a Discord guild. Requires env vars: api_key, base_url, create_guild_channel_auth_apikey_in, create_guild_channel_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "create guild channel",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/channels",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "channels"
      ],
      "variable": [
        {
          "key": "guild_id",
          "value": "<string>"
        }
      ]
    },
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      },
      {
        "key": "Accept",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n\t\"name\": \"{{name}}\",\n\t\"type\": {{type}},\n\t\"topic\": \"{{topic}}\",\n\t\"bitrate\": {{bitrate}},\n\t\"user_limit\": {{user_limit}}\n}",
      "options": {
        "raw": {
          "headerFamily": "json",
          "language": "json"
        }
      }
    },
    "auth": {
      "type": "apikey",
      "apikey": [
        {
          "key": "key",
          "value": "{{pan_mcp_create_guild_channel_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_create_guild_channel_auth_apikey_in}}",
          "type": "string"
        }
      ]
    }
  }
};

// Collection variables (will be merged with environment)
const collectionVariables = [
  {
    "key": "baseUrl",
    "value": "https://discord.com/api/v10"
  },
  {
    "key": "BOT_TOKEN",
    "value": "YOUR BOT USER TOKEN"
  },
  {
    "key": "USER_TOKEN",
    "value": "YOUR USER BEARER TOKEN"
  }
];

/**
 * Executes the API request
 *
 * @param {Object} args - Function arguments
 * @returns {Promise<Object>} API response
 */
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

/**
 * Tool definition for create guild channel
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_guild_channel',
      description: 'Create a new channel in a Discord guild (voice type=2, text type=0)',
      parameters: {
        type: 'object',
        properties: {
          guild_id: { type: 'string', description: 'Discord server ID' },
          name: { type: 'string', description: 'Channel name' },
          type: { type: 'number', description: '2=voice, 0=text, 4=category', default: 2 },
          topic: { type: 'string', description: 'Channel topic' },
          bitrate: { type: 'number', description: 'Voice bitrate', default: 64000 },
          user_limit: { type: 'number', description: 'Max members, 0=unlimited', default: 0 },
          rtc_region: { type: 'string', description: 'Voice region (optional)' },
          parent_id: { type: 'string', description: 'Category ID (optional)' },
        },
        required: ['guild_id', 'name']
      }
    }
  }
};
