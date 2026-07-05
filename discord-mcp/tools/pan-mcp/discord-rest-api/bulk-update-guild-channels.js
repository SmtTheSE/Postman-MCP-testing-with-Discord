/**
 * Update positions of multiple channels in a guild. Requires env vars: api_key, base_url, bulk_update_guild_channels_auth_apikey_in, bulk_update_guild_channels_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "bulk update guild channels",
  "request": {
    "method": "PATCH",
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
      "raw": "[\n\t{\n\t\t\"id\": \"<string>\",\n\t\t\"position\": \"<integer,null>\",\n\t\t\"parent_id\": \"<string,null>\",\n\t\t\"lock_permissions\": \"<boolean,null>\"\n\t},\n\t{\n\t\t\"id\": \"<string>\",\n\t\t\"position\": \"<integer,null>\",\n\t\t\"parent_id\": \"<string,null>\",\n\t\t\"lock_permissions\": \"<boolean,null>\"\n\t}\n]",
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
          "value": "{{pan_mcp_bulk_update_guild_channels_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_bulk_update_guild_channels_auth_apikey_in}}",
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
 * Tool definition for bulk update guild channels
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'bulk_update_guild_channels',
      description: 'Update positions of multiple channels in a guild. Requires env vars: api_key, base_url, bulk_update_guild_channels_auth_apikey_in, bulk_update_guild_channels_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'The guild_id parameter'
          }
        },
        required: ['guild_id']
      }
    }
  }
};
