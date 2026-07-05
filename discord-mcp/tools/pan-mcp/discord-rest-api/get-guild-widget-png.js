/**
 * Retrieve a PNG image widget for a guild, useful for embedding or display. Requires env vars: auth_apikey_key, base_url, bot_token, guild_id
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "get guild widget png",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/widget.png?style=<null>",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "widget.png"
      ],
      "query": [
        {
          "key": "style",
          "value": "<null>"
        }
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
        "value": "image/png"
      }
    ],
    "body": null,
    "auth": {
      "type": "apikey",
      "apikey": [
        {
          "key": "key",
          "value": "{{pan_mcp_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "Bot {{pan_mcp_bot_token}}",
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
const executeFunction = async ({ guild_id }) => {
  return executeRequest(requestDefinition, { guild_id }, collectionVariables);
};

/**
 * Tool definition for get guild widget png
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_guild_widget_png',
      description: 'Retrieve a PNG image widget for a guild, useful for embedding or display. Requires env vars: auth_apikey_key, base_url, bot_token, guild_id',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild'
          }
        },
        required: ['guild_id']
      }
    }
  }
};
