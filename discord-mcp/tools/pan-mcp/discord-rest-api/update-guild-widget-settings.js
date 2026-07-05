/**
 * Updates the widget settings of a guild to customize its appearance and functionality. Requires env vars: api_key, base_url, update_guild_widget_settings_auth_apikey_in, update_guild_widget_settings_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "update guild widget settings",
  "request": {
    "method": "PATCH",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id/widget",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id",
        "widget"
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
      "raw": "{\n\t\"channel_id\": \"<string,null>\",\n\t\"enabled\": \"<boolean,null>\"\n}",
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
          "value": "{{pan_mcp_update_guild_widget_settings_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_update_guild_widget_settings_auth_apikey_in}}",
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
const executeFunction = async ({ guild_id, channel_id, enabled }) => {
  return executeRequest(requestDefinition, { guild_id, channel_id, enabled }, collectionVariables);
};

/**
 * Tool definition for update guild widget settings
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_guild_widget_settings',
      description: 'Updates the widget settings of a guild to customize its appearance and functionality. Requires env vars: api_key, base_url, update_guild_widget_settings_auth_apikey_in, update_guild_widget_settings_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild to update widget settings'
          },
          'channel_id': {
            type: 'string',
            description: 'ID of the widget channel'
          },
          'enabled': {
            type: 'boolean',
            description: 'Flag to enable or disable the widget'
          }
        },
        required: ['guild_id', 'channel_id', 'enabled']
      }
    }
  }
};
