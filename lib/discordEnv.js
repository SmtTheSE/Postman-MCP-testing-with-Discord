import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MCP_ENV = path.resolve(__dirname, '../discord-mcp/.env')

let loaded = false

const AUTH_KEY_DEFAULTS = [
  'pan_mcp_list_my_guilds_auth_apikey_key',
  'pan_mcp_get_my_oauth2_authorization_auth_apikey_key',
  'pan_mcp_create_guild_channel_auth_apikey_key',
  'pan_mcp_create_channel_invite_auth_apikey_key',
  'pan_mcp_list_guild_channels_auth_apikey_key',
  'pan_mcp_get_channel_auth_apikey_key',
  'pan_mcp_update_channel_auth_apikey_key',
  'pan_mcp_delete_channel_auth_apikey_key',
  'pan_mcp_list_channel_invites_auth_apikey_key',
  'pan_mcp_invite_revoke_auth_apikey_key',
  'pan_mcp_get_guild_auth_apikey_key',
  'pan_mcp_list_guild_invites_auth_apikey_key',
]

function applyMcpAuthDefaults() {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('pan_mcp_') && key.endsWith('_auth_apikey_key') && !process.env[key]) {
      process.env[key] = 'Authorization'
    }
    if (key.startsWith('pan_mcp_') && key.endsWith('_auth_apikey_in') && !process.env[key]) {
      process.env[key] = 'header'
    }
  }
  for (const key of AUTH_KEY_DEFAULTS) {
    const inKey = key.replace('_key', '_in')
    process.env[key] = process.env[key] || 'Authorization'
    process.env[inKey] = process.env[inKey] || 'header'
  }
}

/** Load Postman MCP env — user OAuth token is injected at runtime by mcpRunner */
export function loadDiscordMcpEnv() {
  if (loaded) return
  dotenv.config({ path: MCP_ENV })
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
  dotenv.config()

  process.env.pan_mcp_base_url = process.env.pan_mcp_base_url || 'https://discord.com/api/v10'
  applyMcpAuthDefaults()

  loaded = true
}
