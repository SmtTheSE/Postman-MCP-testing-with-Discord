# Goofy Discord

A mobile-first web app for spinning up Discord voice channels, managing servers, and playing music in voice chat — powered by **Discord OAuth** and **Postman MCP** tools.

> **Note — project guideline**  
> This repository is **public source code for learning and sharing**. It is meant to help others explore real-world patterns for **Postman MCP integration** with the Discord REST API — how MCP tools map to API calls, how user OAuth tokens flow through a backend, and how you can build product features on top without reinventing the HTTP layer. Fork, study, and adapt freely; contributions and discussion around MCP + Discord patterns are welcome.

## What is Goofy Discord?

**Goofy Discord** helps gaming groups move fast:

- **Quick Drop** — sign in with Discord, pick a server, create a voice channel, and share a join link in seconds
- **Server Manage** — list, edit, and delete voice channels on servers you can manage
- **Jukebox** (Phase 1) — join a voice channel and play music via Lavalink + discord.js

Channel and guild operations run through **Postman MCP** tool definitions in `discord-mcp/`. The Express API injects the signed-in user's OAuth token at runtime so Discord calls use **their** permissions — no manual bot setup for the core flow.

## Architecture

```
goofy-discord/
├── src/                              # Frontend (React 19 + TypeScript + Tailwind v4)
│   ├── pages/
│   │   ├── CreateChannelPage.tsx     # 3-step channel wizard + quick drop
│   │   ├── ServerManagePage.tsx      # Guild channel management
│   │   └── JukeboxPage.tsx           # Music player UI
│   ├── components/                   # Wizard steps, alerts, share UI
│   ├── context/                      # App + alert state
│   └── services/discordApi.ts        # API client
├── api/                              # Express route handlers
│   ├── auth/                         # Discord OAuth (login, callback, session)
│   ├── create-channel.js             # Create voice channel + invite
│   ├── guilds.js                     # List user's guilds
│   ├── channels.js                   # List / update / delete channels
│   ├── invites.js                    # Guild invite management
│   └── music.js                      # Jukebox join / play / queue
├── lib/
│   ├── mcpRunner.js                  # Injects user or bot token into MCP env
│   ├── manageChannels.js             # Channel CRUD via MCP tools
│   ├── guildAuth.js                  # Permission checks against user token
│   └── music/                        # discord.js + Shoukaku + Lavalink
├── discord-mcp/                      # Postman MCP server + Discord REST tools
│   └── tools/pan-mcp/discord-rest-api/
├── server/
│   ├── local.js                      # Dev API entry (port 3001)
│   ├── lavalink/                     # Lavalink runtime (JAR not in git)
│   └── upgrade-lavalink.sh           # Download Lavalink 4.2+ (DAVE voice)
└── dist/                             # Production frontend build
```

## Postman MCP integration

This project is structured as a **reference for Postman MCP + Discord**:

| Layer | Role |
|-------|------|
| `discord-mcp/tools/` | Postman-generated MCP tools — one per Discord REST endpoint |
| `lib/mcpRunner.js` | Sets `pan_mcp_api_key` to the user's OAuth Bearer token (or bot token for jukebox) |
| `lib/*ViaMcp.js` | Business logic that calls MCP tool modules directly |
| `api/*.js` | HTTP handlers — auth, validation, error formatting |

**User OAuth flow (channel create & manage):**

1. User signs in → access token stored in an HttpOnly JWT cookie
2. API reads session → `runWithUserToken(token, () => toolFn())`
3. MCP tool sends the request to `https://discord.com/api/v10` with the user's token

**Key MCP tools used:**

- `list_my_guilds` — guild picker
- `create_guild_channel` — voice channel creation
- `create_channel_invite` — shareable join link
- `list_guild_channels`, `update_channel`, `delete_channel` — server manage
- `list_guild_invites`, `invite_revoke` — invite management
- `get_guild` — guild metadata

The MCP server can also run standalone: `npm run mcp` or `npm run mcp:http`.

## Tech stack

| Area | Stack |
|------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| Backend | Express, JWT cookies (`jose`) |
| Discord API | REST v10 via Postman MCP tools |
| Auth | Discord OAuth2 (`identify`, `guilds`) |
| Music | discord.js, Shoukaku, Lavalink 4.2+ (DAVE / E2EE voice) |

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/SmtTheSE/Postman-MCP-testing-with-Discord.git
cd Postman-MCP-testing-with-Discord
npm install
cd discord-mcp && npm install && cd ..
```

### 2. Discord OAuth app

1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create an application → **OAuth2**
3. Add redirect: `http://localhost:5173/api/auth/callback`
4. Copy **Client ID** and **Client Secret** into `discord-mcp/.env`:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
SESSION_SECRET=long_random_string
```

### 3. Run the app

```bash
# API (3001) + Vite (5173)
npm run dev

# Or without API file watcher (stable for music debugging)
npm run dev:stable
```

Open http://localhost:5173 — use your machine's LAN IP to test on a phone.

### 4. Jukebox (optional)

Music needs a **bot token** and a local **Lavalink** instance.

1. In the Developer Portal, create a bot under the same (or another) application and copy the token
2. Add to `discord-mcp/.env`:

```env
BOT_TOKEN=your_bot_token
LAVALINK_HOST=localhost:2333
LAVALINK_PASSWORD=youshallnotpass
```

3. Install Java 17+, then download Lavalink (requires **4.2+** for Discord DAVE voice):

```bash
bash server/upgrade-lavalink.sh
cd server/lavalink && java -jar Lavalink.jar
```

4. Invite the bot to your server with **Connect** and **Speak** permissions
5. In the app: **Jukebox** → select server & voice channel → **Join** → search or paste a URL → **Play**

Check readiness: `GET /api/health` returns `oauth` and `music.ready` status.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_CLIENT_ID` | Yes | OAuth app client ID |
| `DISCORD_CLIENT_SECRET` | Yes | OAuth app client secret |
| `SESSION_SECRET` | Recommended | JWT signing secret |
| `BOT_TOKEN` | Jukebox only | Discord bot token |
| `LAVALINK_HOST` | Jukebox only | Default `localhost:2333` |
| `LAVALINK_PASSWORD` | Jukebox only | Default `youshallnotpass` |
| `APP_URL` | Production | Public origin for OAuth redirects |

See `discord-mcp/.env.example` and `.env.example` for templates.

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health, OAuth, and music readiness |
| GET | `/api/auth/status` | OAuth configuration status |
| GET | `/api/auth/discord` | Start Discord OAuth |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/auth/me` | Current user from session |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/guilds` | User's guilds (Manage Channels filter) |
| POST | `/api/create-channel` | Create voice channel + invite |
| GET/POST/PATCH/DELETE | `/api/channels` | List, update, delete channels |
| GET/POST/DELETE | `/api/invites` | List, create, revoke invites |
| POST | `/api/music/join` | Bot joins voice channel |
| POST | `/api/music/play` | Enqueue track (search or URL) |
| POST | `/api/music/skip` | Skip current track |
| POST | `/api/music/pause` | Pause / resume |
| POST | `/api/music/leave` | Leave voice channel |
| GET | `/api/music/queue` | Queue and now-playing state |

### Example: create channel

```json
POST /api/create-channel
{
  "guildId": "YOUR_SERVER_ID",
  "channelName": "Valorant Squad",
  "gameName": "Valorant",
  "description": "Ranked tonight!",
  "memberLimit": 5,
  "bitrate": 64000,
  "region": "us-east",
  "createCategory": false,
  "createTextChannel": false,
  "maxAge": 86400,
  "maxUses": 0
}
```

## Features

- **3-step wizard** — game details → voice settings → server picker
- **Quick Drop** — one-tap presets for common games
- **Discord OAuth** — no token pasting for channel flows
- **Server Manage** — edit bitrate, user limit, region; delete channels
- **Invite management** — view and revoke guild invites
- **Jukebox** — YouTube search/URL playback in voice (Lavalink)
- **Recent channels** — reuse last 20 setups from localStorage
- **Mobile-first UI** — safe areas, 44px tap targets, Web Share API
- **Rate-limit aware** — cached guild list and friendly 429 messages

Voice bitrates are clamped to Discord's per-tier maximum (96 kbps cap in UI).

## Security notes

- OAuth tokens live in **HttpOnly JWT cookies** — never exposed to browser JS
- Channel operations use the **signed-in user's Discord permissions**
- Use HTTPS and `NODE_ENV=production` in production for secure cookies
- Do not commit `discord-mcp/.env`, bot tokens, or Lavalink JARs

## Learning resources

- [Postman MCP documentation](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/)
- [Discord REST API](https://discord.com/developers/docs/reference)
- [Lavalink](https://lavalink.dev/) — audio node for Discord bots

## License

MIT — share and learn freely.

### Phase 2 Jukebox Features
Phase 2 enhances the initial jukebox with a robust queue management experience, per-guild persistence, and playback reliability:
- **Queue Controls:** Play Next, Shuffle, Clear, Remove track, Move track.
- **Playback Modes:** Autoplay (via related tracks or generic fallback) and Repeat (Queue/Track/Off).
- **Session Persistence:** Lightweight local JSON persistence per-guild located in `server/data/jukebox/`. It tracks last queries, voice channel ID, repeat mode, autoplay, and recently played tracks.
- **Reliability:** Built-in error tracking with structured API error codes (`TRACK_RESOLVE_FAILED`, `VOICE_JOIN_TIMEOUT`), bounded retries with jitter for search resolvers, and a state machine tracking playback (`idle`, `joining`, `playing`, `paused`, `error`).
- **UX Refresh:** Responsive inline track controls, playback state polling adaptive interval, and persistent playback error banners.

**Known Limitations:**
- Employs a REST polling mechanism (adaptive 2s-8s) rather than WebSockets.
- Data persistence utilizes synchronous local file storage JSON, fitting the educational/low-footprint theme.
