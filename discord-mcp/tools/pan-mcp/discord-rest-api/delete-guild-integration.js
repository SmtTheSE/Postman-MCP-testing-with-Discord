/**
 * Remove an integration from a guild, deleting associated webhooks and bot users. Requires env vars: api_key, base_url, delete_guild_integration_auth_apikey_in, delete_guild_integration_auth_apikey_key, guild_id, integration_id
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "delete guild integration",
  "request": {
    "method": "DELETE",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/integrations/:integration_id",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "integrations",
        ":integration_id"
      ],
      "variable": [
        {
          "key": "guild_id",
          "value": "<string>"
        },
        {
          "key": "integration_id",
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
          "value": "{{pan_mcp_delete_guild_integration_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_delete_guild_integration_auth_apikey_in}}",
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
const executeFunction = async ({ guild_id, integration_id }) => {
  return executeRequest(requestDefinition, { guild_id, integration_id }, collectionVariables);
};

/**
 * Tool definition for delete guild integration
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'delete_guild_integration',
      description: 'Remove an integration from a guild, deleting associated webhooks and bot users. Requires env vars: api_key, base_url, delete_guild_integration_auth_apikey_in, delete_guild_integration_auth_apikey_key, guild_id, integration_id',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild'
          },
          'integration_id': {
            type: 'string',
            description: 'ID of the integration to remove'
          }
        },
        required: ['guild_id', 'integration_id']
      }
    }
  }
};
