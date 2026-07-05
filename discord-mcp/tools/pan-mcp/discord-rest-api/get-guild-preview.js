/**
 * Retrieve a preview object for a guild, including features, emojis, and stickers. Requires env vars: api_key, base_url, get_guild_preview_auth_apikey_in, get_guild_preview_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "get guild preview",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/preview",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "preview"
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
          "value": "{{pan_mcp_get_guild_preview_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_get_guild_preview_auth_apikey_in}}",
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
const executeFunction = async ({ param }) => {
  return executeRequest(requestDefinition, { param }, collectionVariables);
};

/**
 * Tool definition for get guild preview
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_guild_preview',
      description: 'Retrieve a preview object for a guild, including features, emojis, and stickers. Requires env vars: api_key, base_url, get_guild_preview_auth_apikey_in, get_guild_preview_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'param': {
            type: 'string',
            description: 'The undefined parameter'
          }
        },
        required: ['param']
      }
    }
  }
};
