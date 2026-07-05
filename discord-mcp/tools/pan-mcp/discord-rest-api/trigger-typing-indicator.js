/**
 * Executes 9028c4e3-b284-4b05-b25c-ede3aa002739 API request Requires env vars: api_key, base_url, trigger_typing_indicator_auth_apikey_in, trigger_typing_indicator_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "trigger typing indicator",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/channels/:channel_id/typing",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "channels",
        ":channel_id",
        "typing"
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
          "value": "{{pan_mcp_trigger_typing_indicator_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_trigger_typing_indicator_auth_apikey_in}}",
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
 * Tool definition for trigger typing indicator
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'trigger_typing_indicator',
      description: 'Executes 9028c4e3-b284-4b05-b25c-ede3aa002739 API request Requires env vars: api_key, base_url, trigger_typing_indicator_auth_apikey_in, trigger_typing_indicator_auth_apikey_key',
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
