/**
 * Get onboarding configuration details for a specific guild. Requires env vars: api_key, base_url, get_guilds_onboarding_auth_apikey_in, get_guilds_onboarding_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "get guilds onboarding",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/onboarding",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "onboarding"
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
          "value": "{{pan_mcp_get_guilds_onboarding_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_get_guilds_onboarding_auth_apikey_in}}",
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
 * Tool definition for get guilds onboarding
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_guilds_onboarding',
      description: 'Get onboarding configuration details for a specific guild. Requires env vars: api_key, base_url, get_guilds_onboarding_auth_apikey_in, get_guilds_onboarding_auth_apikey_key',
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
