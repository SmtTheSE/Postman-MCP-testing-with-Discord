import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import createChannel from '../api/create-channel.js'
import health from '../api/health.js'
import authDiscord from '../api/auth/discord.js'
import authCallback from '../api/auth/callback.js'
import authMe from '../api/auth/me.js'
import authLogout from '../api/auth/logout.js'
import authStatus from '../api/auth/status.js'
import guilds from '../api/guilds.js'
import channels from '../api/channels.js'
import invites from '../api/invites.js'
import * as musicApi from '../api/music.js'
import { startMusicBot } from '../lib/music/bot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../discord-mcp/.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

app.post('/api/create-channel', (req, res) => createChannel(req, res))
app.get('/api/health', (req, res) => health(req, res))
app.get('/api/auth/discord', (req, res) => authDiscord(req, res))
app.get('/api/auth/callback', (req, res) => authCallback(req, res))
app.get('/api/auth/me', (req, res) => authMe(req, res))
app.get('/api/auth/status', (req, res) => authStatus(req, res))
app.post('/api/auth/logout', (req, res) => authLogout(req, res))
app.get('/api/guilds', (req, res) => guilds(req, res))
app.all('/api/channels', (req, res) => channels(req, res))
app.all('/api/invites', (req, res) => invites(req, res))
app.post('/api/music/join', (req, res) => musicApi.join(req, res))
app.post('/api/music/play', (req, res) => musicApi.play(req, res))
app.post('/api/music/skip', (req, res) => musicApi.skip(req, res))
app.post('/api/music/pause', (req, res) => musicApi.pause(req, res))
app.post('/api/music/leave', (req, res) => musicApi.leave(req, res))
app.get('/api/music/queue', (req, res) => musicApi.queue(req, res))
app.post('/api/music/remove', (req, res) => musicApi.remove(req, res))
app.post('/api/music/move', (req, res) => musicApi.move(req, res))
app.post('/api/music/clear', (req, res) => musicApi.clear(req, res))
app.post('/api/music/shuffle', (req, res) => musicApi.shuffle(req, res))
app.post('/api/music/repeat', (req, res) => musicApi.repeat(req, res))
app.post('/api/music/autoplay', (req, res) => musicApi.autoplay(req, res))
app.post('/api/music/play-next', (req, res) => musicApi.playNext(req, res))

startMusicBot().catch((err) => {
  console.error('[music] failed to start:', err.message)
})

app.listen(PORT, () => {
  console.log(`API (Postman MCP + OAuth) → http://localhost:${PORT}/api/health`)
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Run: kill -9 $(lsof -t -i:${PORT})`)
    process.exit(1)
  }
  throw err
})
