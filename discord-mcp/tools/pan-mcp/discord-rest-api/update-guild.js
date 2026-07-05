/**
 * Update settings for a guild, including features, roles, and channels. Requires env vars: api_key, base_url, update_guild_auth_apikey_in, update_guild_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "update guild",
  "request": {
    "method": "PATCH",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id"
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
      "raw": "{\n\t\"name\": \"<string>\",\n\t\"description\": \"<string,null>\",\n\t\"region\": \"<string,null>\",\n\t\"icon\": \"<string,null>\",\n\t\"verification_level\": \"<null>\",\n\t\"default_message_notifications\": \"<null>\",\n\t\"explicit_content_filter\": \"<null>\",\n\t\"preferred_locale\": \"<null>\",\n\t\"afk_timeout\": \"<null>\",\n\t\"afk_channel_id\": \"<string,null>\",\n\t\"system_channel_id\": \"<string,null>\",\n\t\"owner_id\": \"<string>\",\n\t\"splash\": \"<string,null>\",\n\t\"banner\": \"<string,null>\",\n\t\"system_channel_flags\": \"<integer,null>\",\n\t\"features\": null,\n\t\"discovery_splash\": \"<string,null>\",\n\t\"home_header\": \"<string,null>\",\n\t\"rules_channel_id\": \"<string,null>\",\n\t\"safety_alerts_channel_id\": \"<string,null>\",\n\t\"public_updates_channel_id\": \"<string,null>\",\n\t\"premium_progress_bar_enabled\": \"<boolean,null>\"\n}",
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
          "value": "{{pan_mcp_update_guild_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_update_guild_auth_apikey_in}}",
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
 * Tool definition for update guild
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_guild',
      description: 'Update settings for a guild, including features, roles, and channels. Requires env vars: api_key, base_url, update_guild_auth_apikey_in, update_guild_auth_apikey_key',
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
