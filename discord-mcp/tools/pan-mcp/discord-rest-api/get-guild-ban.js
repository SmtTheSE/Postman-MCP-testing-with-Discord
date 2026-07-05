/**
 * Retrieve ban details for a user in a guild, including user info and reason. Requires env vars: api_key, base_url, get_guild_ban_auth_apikey_in, get_guild_ban_auth_apikey_key, guild_id, user_id
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "get guild ban",
  "request": {
    "method": "GET",
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
          "value": "{{pan_mcp_get_guild_ban_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_get_guild_ban_auth_apikey_in}}",
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
 * Tool definition for get guild ban
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_guild_ban',
      description: 'Retrieve ban details for a user in a guild, including user info and reason. Requires env vars: api_key, base_url, get_guild_ban_auth_apikey_in, get_guild_ban_auth_apikey_key, guild_id, user_id',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild'
          },
          'user_id': {
            type: 'string',
            description: 'ID of the user to check ban status'
          }
        },
        required: ['guild_id', 'user_id']
      }
    }
  }
};
