/**
 * Follow an announcement channel to send messages to a target channel. Requires env vars: api_key, base_url, follow_channel_auth_apikey_in, follow_channel_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "follow channel",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/channels/:channel_id/followers",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "channels",
        ":channel_id",
        "followers"
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
      "raw": "{\n\t\"webhook_channel_id\": \"<string>\"\n}",
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
          "value": "{{pan_mcp_follow_channel_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_follow_channel_auth_apikey_in}}",
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
const executeFunction = async ({ channel_id }) => {
  return executeRequest(requestDefinition, { channel_id }, collectionVariables);
};

/**
 * Tool definition for follow channel
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'follow_channel',
      description: 'Follow an announcement channel to send messages to a target channel. Requires env vars: api_key, base_url, follow_channel_auth_apikey_in, follow_channel_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'channel_id': {
            type: 'string',
            description: 'The channel_id parameter'
          }
        },
        required: ['channel_id']
      }
    }
  }
};
