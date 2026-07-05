# VoiceDrop

Create Discord voice channels from your phone. Sign in with Discord, pick a server, and share a join link with friends — all in seconds, no bot setup needed.

## What is VoiceDrop?

VoiceDrop is a **mobile-first web app** that lets you auto-create Discord voice channels and instantly share the join link. Perfect for that "Hey, are we gonna play?" moment — you sign in, pick a server, and the channel is created directly under your Discord account via OAuth.

## Architecture

```
voice-drop/
├── src/                          # Frontend (React + TypeScript + Tailwind)
│   ├── components/               # UI Components (3-step wizard, guild picker, share)
│   ├── context/AppContext.tsx     # Global state with localStorage persistence
│   ├── hooks/                     # Custom hooks (wizard, localStorage)
│   ├── pages/                     # App pages
│   ├── services/discordApi.ts    # API layer calling backend
│   └── App.tsx                    # Root app with routing
├── api/                          # Backend route handlers (Express)
│   ├── create-channel.js         # Creates voice channel via MCP (user OAuth)
│   ├── guilds.js                 # Lists user's Discord guilds via OAuth
│   └── auth/                     # OAuth flow handlers
├── lib/                          # Backend libraries
│   ├── createChannel.js          # MCP-powered channel creation (user token)
│   ├── mcpRunner.js               # Postman MCP runner with user token injection
│   ├── discordOAuth.js           # OAuth URL builder, token exchange
│   ├── session.js                # JWT cookie session management
│   └── discordEnv.js             # MCP env variable loader
├── discord-mcp/                  # Postman MCP server + tool definitions
│   └── tools/                     # MCP tools: create-guild-channel, list-my-guilds, etc.
├── server/local.js               # Express entry point
└── dist/                         # Production build
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7
- **Backend**: Express (Node.js), JWT cookies via `jose`
- **API**: Discord REST API v10 (via Postman MCP tools)
- **Auth**: Discord OAuth2 with `identify` + `guilds` scopes
- **Storage**: localStorage for recent channels, JWT cookies for session

## Flow

1. **User signs in** with Discord OAuth (popup redirect → token stored in JWT cookie)
2. **User's guilds** are fetched via Postman MCP `list_my_guilds` using the user's Bearer token
3. **User picks a server** they have Manage Channels permission on
4. **Channel is created** via Postman MCP `create_guild_channel` using the user's Bearer token
5. **Invite is generated** via `create_channel_invite` → share link returned

**No bot token, no bot invite, no manual guild IDs.** All Discord API calls use the signed-in user's OAuth token.

## Quick Start

### 1. Clone and Install

```bash
npm install
cd server && npm install && cd ..
cd discord-mcp && npm install && cd ..
```

### 2. Setup Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application → OAuth2 tab
3. Copy **CLIENT ID** and **CLIENT SECRET**
4. Add redirect URL: `http://localhost:5173/api/auth/callback`
5. Save these to `discord-mcp/.env`:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### 3. Run the App

```bash
# Single command — starts API server + Vite dev server
npm run dev
```

Open http://localhost:5173 on your phone (use your machine's local IP for mobile testing).

## Environment Variables

```bash
# discord-mcp/.env (required)
DISCORD_CLIENT_ID=your_client_id       # From Discord Developer Portal → OAuth2
DISCORD_CLIENT_SECRET=your_client_secret # From Discord Developer Portal → OAuth2

# Optional
SESSION_SECRET=your_secret             # JWT signing secret (uses dev default otherwise)
APP_URL=https://yourdomain.com         # Production origin override
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/auth/status` | Check OAuth configuration readiness |
| GET    | `/api/auth/discord` | Redirect to Discord OAuth consent page |
| GET    | `/api/auth/callback` | Handle OAuth redirect, exchange code, store JWT |
| GET    | `/api/auth/me` | Return current user from session cookie |
| POST   | `/api/auth/logout` | Clear session cookie |
| GET    | `/api/guilds` | List user's Discord guilds (requires OAuth session) |
| POST   | `/api/create-channel` | Create voice channel + invite (requires OAuth session) |
| GET    | `/api/health` | Health check |

### POST /api/create-channel

Request body (no auth header needed — session cookie handles it):
```json
{
  "guildId": "YOUR_SERVER_ID",
  "channelName": "Valorant Squad",
  "gameName": "Valorant",
  "description": "Ranked tonight!",
  "memberLimit": 5,
  "bitrate": 64000,
  "region": "us-east"
}
```

Response:
```json
{
  "success": true,
  "channel": { "id": "...", "name": "...", "type": 2 },
  "inviteUrl": "https://discord.gg/abc123"
}
```

## Mobile First Design

- **Tap targets**: 44px minimum
- **Safe area**: Respects iOS notch and Android edge-to-edge
- **No pinch-to-zoom**: `maximum-scale=1`, `user-scalable=no` via viewport meta
- **Native share**: Uses Web Share API when available (mobile), falls back to clipboard copy
- **Keyboard-aware**: Input font-size 16px prevents zoom on iOS

## Postman MCP Integration

All Discord API calls flow through Postman MCP tools:

- `list_my_guilds` — fetches user's guilds (user OAuth token)
- `create_guild_channel` — creates the voice channel (user OAuth token)
- `create_channel_invite` — generates a shareable invite (user OAuth token)
- `get_my_oauth2_authorization` — validates OAuth token

The MCP server lives in `discord-mcp/` and runs alongside the Express API via `server/local.js`.

## Features

- 3-step wizard: Game details → Voice settings → Pick server
- **OAuth sign-in** — no bot setup, no token pasting
- **Auto guild list** — your servers shown after sign-in, filtered by Manage Channels permission
- **Instant share** via Web Share API or clipboard copy
- **Audio quality** selection (64/96/128 kbps)
- **Region selection** for optimal voice latency
- **Member limit** slider
- **Recent channels** history (last 20, tap to reuse)
- Responsive design works on any screen

## Security Notes

- OAuth tokens are stored in **HttpOnly JWT cookies** (server-side, not accessible from JS)
- No Discord tokens are sent to the browser
- Channel creation uses the **user's own Discord permissions** — only servers they can manage
- In production, use HTTPS and set `NODE_ENV=production` for Secure cookies

## License

MIT