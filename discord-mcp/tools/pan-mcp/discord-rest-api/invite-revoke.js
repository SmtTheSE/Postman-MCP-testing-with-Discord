/**
 * Revoke (delete) an invite using its code. Requires env vars: api_key, base_url, invite_revoke_auth_apikey_in, invite_revoke_auth_apikey_key
 * 
 * This tool uses postman-runtime to execute the request,
 * ensuring full compatibility with Postman collections.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';

// Original Postman request definition
const requestDefinition = {
  "name": "invite revoke",
  "request": {
    "method": "DELETE",
    "url": {
      "raw": "{{pan_mcp_base_url}}/invites/:code",
      "host": [
        "{{pan_mcp_base_url}}"
      ],
      "path": [
        "invites",
        ":code"
      ],
      "variable": [
        {
          "key": "code",
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
          "value": "{{pan_mcp_invite_revoke_auth_apikey_key}}",
          "type": "string"
        },
        {
          "key": "value",
          "value": "{{pan_mcp_api_key}}",
          "type": "string"
        },
        {
          "key": "in",
          "value": "{{pan_mcp_invite_revoke_auth_apikey_in}}",
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
const executeFunction = async ({ code }) => {
  return executeRequest(requestDefinition, { code }, collectionVariables);
};

/**
 * Tool definition for invite revoke
 */
export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'invite_revoke',
      description: 'Revoke (delete) an invite using its code. Requires env vars: api_key, base_url, invite_revoke_auth_apikey_in, invite_revoke_auth_apikey_key',
      parameters: {
        type: 'object',
        properties: {
          'code': {
            type: 'string',
            description: 'The code parameter'
          }
        },
        required: ['code']
      }
    }
  }
};
