/**
 * Creates a new guild with specified properties such as name, roles, and channels. Requires env vars: api_key, base_url, create_guild_auth_apikey_in, create_guild_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "create guild",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds"
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
      "raw": "{\n\t\"name\": \"<string>\",\n\t\"description\": \"<string,null>\",\n\t\"region\": \"<string,null>\",\n\t\"icon\": \"<string,null>\",\n\t\"verification_level\": \"<null>\",\n\t\"default_message_notifications\": \"<null>\",\n\t\"explicit_content_filter\": \"<null>\",\n\t\"preferred_locale\": \"<null>\",\n\t\"afk_timeout\": \"<null>\",\n\t\"roles\": [\n\t\t{\n\t\t\t\"id\": \"<integer>\",\n\t\t\t\"name\": \"<string,null>\",\n\t\t\t\"permissions\": \"<integer,null>\",\n\t\t\t\"color\": \"<integer,null>\",\n\t\t\t\"hoist\": \"<boolean,null>\",\n\t\t\t\"mentionable\": \"<boolean,null>\",\n\t\t\t\"unicode_emoji\": \"<string,null>\"\n\t\t},\n\t\t{\n\t\t\t\"id\": \"<integer>\",\n\t\t\t\"name\": \"<string,null>\",\n\t\t\t\"permissions\": \"<integer,null>\",\n\t\t\t\"color\": \"<integer,null>\",\n\t\t\t\"hoist\": \"<boolean,null>\",\n\t\t\t\"mentionable\": \"<boolean,null>\",\n\t\t\t\"unicode_emoji\": \"<string,null>\"\n\t\t}\n\t],\n\t\"channels\": null,\n\t\"afk_channel_id\": \"<string,null>\",\n\t\"system_channel_id\": \"<string,null>\",\n\t\"system_channel_flags\": \"<integer,null>\"\n}",
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
          "value": "{{pan_mcp_create_guild_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_create_guild_auth_apikey_in}}",
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
const executeFunction = async ({ name, description, region, icon, verification_level, default_message_notifications, explicit_content_filter, preferred_locale, afk_timeout, roles, channels, afk_channel_id, system_channel_id, system_channel_flags }) => {
  return executeRequest(requestDefinition, { name, description, region, icon, verification_level, default_message_notifications, explicit_content_filter, preferred_locale, afk_timeout, roles, channels, afk_channel_id, system_channel_id, system_channel_flags }, collectionVariables);
};

/**
 * Tool definition for create guild
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_guild',
      description: 'Creates a new guild with specified properties such as name, roles, and channels. Requires env vars: api_key, base_url, create_guild_auth_apikey_in, create_guild_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'name': {
            type: 'string',
            description: 'Name of the new guild'
          },
          'description': {
            type: 'string',
            description: 'Description of the guild'
          },
          'region': {
            type: 'string',
            description: 'Region where the guild is hosted'
          },
          'icon': {
            type: 'string',
            description: 'Icon image URL'
          },
          'verification_level': {
            type: 'string',
            description: 'Verification level setting'
          },
          'default_message_notifications': {
            type: 'string',
            description: 'Default notification settings'
          },
          'explicit_content_filter': {
            type: 'string',
            description: 'Content filter level'
          },
          'preferred_locale': {
            type: 'string',
            description: 'Locale for the guild'
          },
          'afk_timeout': {
            type: 'string',
            description: 'AFK timeout duration'
          },
          'roles': {
            type: 'array',
            description: 'Roles to assign in the guild'
          },
          'channels': {
            type: 'string',
            description: 'Channels to create in the guild'
          },
          'afk_channel_id': {
            type: 'string',
            description: 'ID of the AFK channel'
          },
          'system_channel_id': {
            type: 'string',
            description: 'ID of the system channel'
          },
          'system_channel_flags': {
            type: 'string',
            description: 'Flags for system channel behavior'
          }
        },
        required: ['name', 'description', 'region', 'icon', 'verification_level', 'default_message_notifications', 'explicit_content_filter', 'preferred_locale', 'afk_timeout', 'roles', 'channels', 'afk_channel_id', 'system_channel_id', 'system_channel_flags']
      }
    }
  }
};
