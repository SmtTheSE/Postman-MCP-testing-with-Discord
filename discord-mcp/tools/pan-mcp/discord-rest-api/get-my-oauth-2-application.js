/**
 * Retrieve the OAuth2 application details associated with the bot user. Requires env vars: api_key, base_url, get_my_oauth2_application_auth_apikey_in, get_my_oauth2_application_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "get my oauth2 application",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{pan_mcp_base_url}}/oauth2/applications/@me",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "oauth2",
        "applications",
        "@me"
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
          "value": "{{pan_mcp_get_my_oauth2_application_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_get_my_oauth2_application_auth_apikey_in}}",
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
const executeFunction = async (args) => {
  return executeRequest(requestDefinition, {}, collectionVariables);
};

/**
 * Tool definition for get my oauth2 application
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_my_oauth2_application',
      description: 'Retrieve the OAuth2 application details associated with the bot user. Requires env vars: api_key, base_url, get_my_oauth2_application_auth_apikey_in, get_my_oauth2_application_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {

        },
        required: []
      }
    }
  }
};
