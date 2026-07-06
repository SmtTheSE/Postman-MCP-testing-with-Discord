/**
 * Update settings for a Discord channel.
 */
import { executeRequest } from '../../../lib/postmanExecutor.js';
import { clampVoiceBitrate } from '../../../../lib/voiceBitrate.js';

const requestDefinition = {
  "name": "update channel",
  "request": {
    "method": "PATCH",
    "url": {
      "raw": "{{pan_mcp_base_url}}/channels/:channel_id",
      "host": ["{{pan_mcp_base_url}}"],
      "path": ["channels", ":channel_id"],
      "variable": [{ "key": "channel_id", "value": "<string>" }]
    },
    "header": [
      { "key": "Content-Type", "value": "application/json" },
      { "key": "Accept", "value": "application/json" }
    ],
    "body": {
      "mode": "raw",
      "raw": "{}",
      "options": { "raw": { "headerFamily": "json", "language": "json" } }
    },
    "auth": {
      "type": "apikey",
      "apikey": [
        { "key": "key", "value": "{{pan_mcp_update_channel_auth_apikey_key}}", "type": "string" },
        { "key": "value", "value": "{{pan_mcp_api_key}}", "type": "string" },
        { "key": "in", "value": "{{pan_mcp_update_channel_auth_apikey_in}}", "type": "string" }
      ]
    }
  }
};

const collectionVariables = [
  { "key": "baseUrl", "value": "https://discord.com/api/v10" }
];

const executeFunction = async ({
  channel_id,
  name,
  topic,
  bitrate,
  user_limit,
  rtc_region,
  parent_id,
}) => {
  const def = JSON.parse(JSON.stringify(requestDefinition))
  const body = {}

  if (name != null && String(name).trim()) body.name = String(name).trim().slice(0, 100)
  if (topic != null) body.topic = String(topic).trim().slice(0, 1024)
  if (bitrate != null) body.bitrate = clampVoiceBitrate(bitrate)
  if (user_limit != null) body.user_limit = Number(user_limit)
  if (rtc_region != null) body.rtc_region = String(rtc_region)
  if (parent_id != null && String(parent_id).trim()) body.parent_id = String(parent_id).trim()

  def.request.body.raw = JSON.stringify(body)
  return executeRequest(def, { channel_id }, collectionVariables)
};

export const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_channel',
      description: 'Update settings for a Discord channel',
      parameters: {
        type: 'object',
        properties: {
          channel_id: { type: 'string', description: 'Channel ID' },
          name: { type: 'string', description: 'New channel name' },
          topic: { type: 'string', description: 'Channel topic' },
          bitrate: { type: 'number', description: 'Voice bitrate' },
          user_limit: { type: 'number', description: 'Max members' },
          rtc_region: { type: 'string', description: 'Voice region' },
          parent_id: { type: 'string', description: 'Category ID' },
        },
        required: ['channel_id']
      }
    }
  }
};
