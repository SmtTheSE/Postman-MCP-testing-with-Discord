/**
 * List the guilds where the user is a member, with details like permissions and features. Requires env vars: api_key, base_url, list_my_guilds_auth_apikey_in, list_my_guilds_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "list my guilds",
  "request": {
    "method": "GET",
    "url": {
      "raw": "{{pan_mcp_base_url}}/users/@me/guilds?before=<string,null>&after=<string,null>&limit=<integer,null>&with_counts=<boolean,null>",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "users",
        "@me",
        "guilds"
      ],
      "query": [
        {
          "key": "before",
          "value": "<string,null>"
        },
        {
          "key": "after",
          "value": "<string,null>"
        },
        {
          "key": "limit",
          "value": "<integer,null>"
        },
        {
          "key": "with_counts",
          "value": "<boolean,null>"
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
          "value": "{{pan_mcp_list_my_guilds_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_list_my_guilds_auth_apikey_in}}",
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
function buildListGuildsRequest({ before, after, limit, with_counts } = {}) {
  const def = JSON.parse(JSON.stringify(requestDefinition))
  const query = []
  if (before) query.push({ key: 'before', value: String(before) })
  if (after) query.push({ key: 'after', value: String(after) })
  if (limit != null) query.push({ key: 'limit', value: String(limit) })
  if (with_counts != null) query.push({ key: 'with_counts', value: String(with_counts) })

  def.request.url.query = query
  const qs = query.map((q) => `${q.key}=${encodeURIComponent(q.value)}`).join('&')
  def.request.url.raw = qs
    ? `{{pan_mcp_base_url}}/users/@me/guilds?${qs}`
    : `{{pan_mcp_base_url}}/users/@me/guilds`
  return def
}

const executeFunction = async (args = {}) => {
  return executeRequest(buildListGuildsRequest(args), {}, collectionVariables)
}

/**
 * Tool definition for list my guilds
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'list_my_guilds',
      description: 'List the guilds where the user is a member, with details like permissions and features. Requires env vars: api_key, base_url, list_my_guilds_auth_apikey_in, list_my_guilds_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          before: { type: 'string', description: 'Snowflake — get guilds before this id' },
          after: { type: 'string', description: 'Snowflake — get guilds after this id' },
          limit: { type: 'integer', description: 'Max guilds to return (1–200)' },
          with_counts: { type: 'boolean', description: 'Include approximate member counts' },
        },
        required: []
      }
    }
  }
};
