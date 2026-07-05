/**
 * Updates the welcome screen properties and channels for a guild to customize onboarding. Requires env vars: api_key, base_url, update_guild_welcome_screen_auth_apikey_in, update_guild_welcome_screen_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "update guild welcome screen",
  "request": {
    "method": "PATCH",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/welcome-screen",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "welcome-screen"
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
      "raw": "{\n\t\"description\": \"<string,null>\",\n\t\"welcome_channels\": [\n\t\t{\n\t\t\t\"channel_id\": \"<string>\",\n\t\t\t\"description\": \"<string>\",\n\t\t\t\"emoji_id\": \"<string,null>\",\n\t\t\t\"emoji_name\": \"<string,null>\"\n\t\t},\n\t\t{\n\t\t\t\"channel_id\": \"<string>\",\n\t\t\t\"description\": \"<string>\",\n\t\t\t\"emoji_id\": \"<string,null>\",\n\t\t\t\"emoji_name\": \"<string,null>\"\n\t\t}\n\t],\n\t\"enabled\": \"<boolean,null>\"\n}",
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
          "value": "{{pan_mcp_update_guild_welcome_screen_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_update_guild_welcome_screen_auth_apikey_in}}",
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
const executeFunction = async ({ guild_id, description, welcome_channels, enabled }) => {
  return executeRequest(requestDefinition, { guild_id, description, welcome_channels, enabled }, collectionVariables);
};

/**
 * Tool definition for update guild welcome screen
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_guild_welcome_screen',
      description: 'Updates the welcome screen properties and channels for a guild to customize onboarding. Requires env vars: api_key, base_url, update_guild_welcome_screen_auth_apikey_in, update_guild_welcome_screen_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild to update welcome screen for'
          },
          'description': {
            type: 'string',
            description: 'Description of the welcome screen'
          },
          'welcome_channels': {
            type: 'array',
            description: 'List of welcome channels with details'
          },
          'enabled': {
            type: 'boolean',
            description: 'Flag to enable or disable welcome screen'
          }
        },
        required: ['guild_id', 'description', 'welcome_channels', 'enabled']
      }
    }
  }
};
