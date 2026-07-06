/**
 * Retrieve detailed information about a guild, including features, roles, and settings. Requires env vars: api_key, base_url, get_guild_auth_apikey_in, get_guild_auth_apikey_key, guild_id
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "get guild",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{pan_mcp_base_url}}/guilds/:guild_id?with_counts=<boolean,null>",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "guilds",
        ":guild_id"
      ],
      "query": [
        {
          "key": "with_counts",
          "value": "<boolean,null>"
        }
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
          "value": "{{pan_mcp_get_guild_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_get_guild_auth_apikey_in}}",
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
const executeFunction = async ({ guild_id, with_counts = true }) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))
  if (with_counts) {
    def.request.url.query = [{ key: 'with_counts', value: 'true' }]
    const pathStr = def.request.url.path.join('/')
    def.request.url.raw = `${def.request.url.host[0]}/${pathStr}?with_counts=true`
  } else if (Array.isArray(def.request.url.query)) {
    def.request.url.query = def.request.url.query.filter((q) => !String(q?.value).includes('null'))
  }
  return executeRequest(def, { guild_id, with_counts: with_counts ? 'true' : 'false' }, collectionVariables);
};

/**
 * Tool definition for get guild
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_guild',
      description: 'Retrieve detailed information about a guild, including features, roles, and settings. Requires env vars: api_key, base_url, get_guild_auth_apikey_in, get_guild_auth_apikey_key, guild_id',
      parameters: {
        type: 'object',
        properties: {
          'guild_id': {
            type: 'string',
            description: 'ID of the guild'
          }
        },
        required: ['guild_id']
      }
    }
  }
};
