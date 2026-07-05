/**
 * Ban a user from a guild, optionally deleting recent messages. Requires env vars: api_key, ban_user_from_guild_auth_apikey_in, ban_user_from_guild_auth_apikey_key, base_url, guild_id, user_id
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "ban user from guild",
  "request": {
    "method": "PUT",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/bans/:user_id",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "bans",
        ":user_id"
      ],
      "variable": [
        {
          "key": "guild_id",
          "value": "<string>"
        },
        {
          "key": "user_id",
          "value": "<string>"
        }
      ]
    },
    "header": [
      {
        "key": "Accept",
        "value": "application/json"
      }
    ],
    "body": null,
    "auth": {
      "type": "apikey",
      "apikey": [
        {
          "key": "key",
          "value": "{{pan_mcp_ban_user_from_guild_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_ban_user_from_guild_auth_apikey_in}}",
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
const executeFunction = async ({ guild_id, user_id }) => {
  return executeRequest(requestDefinition, { guild_id, user_id }, collectionVariables);
};

/**
 * Tool definition for ban user from guild
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'ban_user_from_guild',
      description: 'Ban a user from a guild, optionally deleting recent messages. Requires env vars: api_key, ban_user_from_guild_auth_apikey_in, ban_user_from_guild_auth_apikey_key, base_url, guild_id, user_id',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild'
          },
          'user_id': {
            type: 'string',
            description: 'ID of the user to ban'
          }
        },
        required: ['guild_id', 'user_id']
      }
    }
  }
};
