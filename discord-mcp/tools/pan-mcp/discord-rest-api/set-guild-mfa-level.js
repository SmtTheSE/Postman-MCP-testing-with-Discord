/**
 * Sets the MFA level for a guild to enhance security for moderation actions. Requires env vars: api_key, base_url, set_guild_mfa_level_auth_apikey_in, set_guild_mfa_level_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "set guild mfa level",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/mfa",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "mfa"
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
      "raw": "{\n\t\"level\": {\n\t\t\"title\": \"NONE\",\n\t\t\"description\": \"Guild has no MFA/2FA requirement for moderation actions\",\n\t\t\"const\": 0\n\t}\n}",
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
          "value": "{{pan_mcp_set_guild_mfa_level_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_set_guild_mfa_level_auth_apikey_in}}",
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
const executeFunction = async ({ guild_id, level }) => {
  return executeRequest(requestDefinition, { guild_id, level }, collectionVariables);
};

/**
 * Tool definition for set guild mfa level
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'set_guild_mfa_level',
      description: 'Sets the MFA level for a guild to enhance security for moderation actions. Requires env vars: api_key, base_url, set_guild_mfa_level_auth_apikey_in, set_guild_mfa_level_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild to set MFA level'
          },
          'level': {
            type: 'object',
            description: 'MFA level setting'
          }
        },
        required: ['guild_id', 'level']
      }
    }
  }
};
