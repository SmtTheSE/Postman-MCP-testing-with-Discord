/**
 * Remove a user from a group DM in Discord. Requires env vars: api_key, base_url, delete_channel_auth_apikey_in, delete_channel_auth_apikey_key, delete_group_dm_user_auth_apikey_in, delete_group_dm_user_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "delete channel",
  "request": {
    "method": "DELETE",
    "url": {
      "raw": "{{pan_mcp_base_url}}/channels/:channel_id",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "channels",
        ":channel_id"
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
          "value": "{{pan_mcp_delete_channel_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_delete_channel_auth_apikey_in}}",
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
const executeFunction = async ({ channel_id, user_id }) => {
  return executeRequest(requestDefinition, { channel_id, user_id }, collectionVariables);
};

/**
 * Tool definition for delete channel
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'delete_channel',
      description: 'Remove a user from a group DM in Discord. Requires env vars: api_key, base_url, delete_channel_auth_apikey_in, delete_channel_auth_apikey_key, delete_group_dm_user_auth_apikey_in, delete_group_dm_user_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'channel_id': {
            type: 'string',
            description: 'The channel_id parameter'
          },
          'user_id': {
            type: 'string',
            description: 'The user_id parameter'
          }
        },
        required: ['channel_id', 'user_id']
      }
    }
  }
};
