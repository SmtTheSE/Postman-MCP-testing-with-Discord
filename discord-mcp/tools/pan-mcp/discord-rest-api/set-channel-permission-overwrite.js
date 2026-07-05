/**
 * Set permission overwrites for a Discord channel. Requires env vars: api_key, base_url, set_channel_permission_overwrite_auth_apikey_in, set_channel_permission_overwrite_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "set channel permission overwrite",
  "request": {
    "method": "PUT",
    "url": {
      "raw": "{{pan_mcp_base_url}}/channels/:channel_id/permissions/:overwrite_id",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "channels",
        ":channel_id",
        "permissions",
        ":overwrite_id"
      ],
      "variable": [
        {
          "key": "channel_id",
          "value": "<string>"
        },
        {
          "key": "overwrite_id",
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
      "raw": "{\n\t\"type\": \"<null>\",\n\t\"allow\": \"<integer,null>\",\n\t\"deny\": \"<integer,null>\"\n}",
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
          "value": "{{pan_mcp_set_channel_permission_overwrite_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_set_channel_permission_overwrite_auth_apikey_in}}",
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
const executeFunction = async ({ channel_id, overwrite_id }) => {
  return executeRequest(requestDefinition, { channel_id, overwrite_id }, collectionVariables);
};

/**
 * Tool definition for set channel permission overwrite
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'set_channel_permission_overwrite',
      description: 'Set permission overwrites for a Discord channel. Requires env vars: api_key, base_url, set_channel_permission_overwrite_auth_apikey_in, set_channel_permission_overwrite_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'channel_id': {
            type: 'string',
            description: 'The channel_id parameter'
          },
          'overwrite_id': {
            type: 'string',
            description: 'The overwrite_id parameter'
          }
        },
        required: ['channel_id', 'overwrite_id']
      }
    }
  }
};
