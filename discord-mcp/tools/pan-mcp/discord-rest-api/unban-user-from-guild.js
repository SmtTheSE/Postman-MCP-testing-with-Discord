/**
 * Unban a user from a guild by removing their ban. Requires env vars: api_key, base_url, unban_user_from_guild_auth_apikey_in, unban_user_from_guild_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "unban user from guild",
  "request": {
    "method": "DELETE",
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
          "value": "{{pan_mcp_unban_user_from_guild_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_unban_user_from_guild_auth_apikey_in}}",
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
const executeFunction = async ({ param, param }) => {
  return executeRequest(requestDefinition, { param, param }, collectionVariables);
};

/**
 * Tool definition for unban user from guild
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'unban_user_from_guild',
      description: 'Unban a user from a guild by removing their ban. Requires env vars: api_key, base_url, unban_user_from_guild_auth_apikey_in, unban_user_from_guild_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'param': {
            type: 'string',
            description: 'The undefined parameter'
          },
          'param': {
            type: 'string',
            description: 'The undefined parameter'
          }
        },
        required: ['param', 'param']
      }
    }
  }
};
