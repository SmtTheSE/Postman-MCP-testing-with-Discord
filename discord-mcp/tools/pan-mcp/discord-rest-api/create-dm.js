/**
 * Opens a direct message channel with a user to enable private communication. Requires env vars: api_key, base_url, create_dm_auth_apikey_in, create_dm_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "create dm",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/users/@me/channels",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "users",
        "@me",
        "channels"
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
      "raw": "{\n\t\"recipient_id\": \"<string,null>\",\n\t\"access_tokens\": [\n\t\t\"<string>\",\n\t\t\"<string>\"\n\t],\n\t\"nicks\": null\n}",
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
          "value": "{{pan_mcp_create_dm_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_create_dm_auth_apikey_in}}",
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
const executeFunction = async ({ recipient_id }) => {
  return executeRequest(requestDefinition, { recipient_id }, collectionVariables);
};

/**
 * Tool definition for create dm
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_dm',
      description: 'Opens a direct message channel with a user to enable private communication. Requires env vars: api_key, base_url, create_dm_auth_apikey_in, create_dm_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'recipient_id': {
            type: 'string',
            description: 'ID of the user to start DM with'
          }
        },
        required: ['recipient_id']
      }
    }
  }
};
