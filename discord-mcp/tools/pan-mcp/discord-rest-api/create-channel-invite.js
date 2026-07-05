/**
 * Create an invite for a specific channel. Requires env vars: api_key, base_url, create_channel_invite_auth_apikey_in, create_channel_invite_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "create channel invite",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/channels/:channel_id/invites",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "channels",
        ":channel_id",
        "invites"
      ],
      "variable": [
        {
          "key": "channel_id",
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
      "raw": "{\n\t\"max_age\": \"<integer,null>\"\n}",
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
          "value": "{{pan_mcp_create_channel_invite_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_create_channel_invite_auth_apikey_in}}",
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
const executeFunction = async ({ channel_id, max_age = 86400, max_uses = 0 }) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))
  def.request.body.raw = JSON.stringify({ max_age: Number(max_age), max_uses: Number(max_uses) })
  return executeRequest(def, { channel_id, max_age: String(max_age), max_uses: String(max_uses) }, collectionVariables)
}

/**
 * Tool definition for create channel invite
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_channel_invite',
      description: 'Create an invite for a specific channel. Requires env vars: api_key, base_url, create_channel_invite_auth_apikey_in, create_channel_invite_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'channel_id': {
            type: 'string',
            description: 'The channel_id parameter'
          },
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
      }
    }
  }
};
