const fs = require('fs')

let discordApi = fs.readFileSync('src/services/discordApi.ts', 'utf8')

// Seems the discordApi.ts patch failed or I wrote to discordApi.ts.new? No I used patch_frontend_api.cjs
// Let's just do it directly.

discordApi = discordApi.replace(
    "export interface MusicTrack {",
    "export interface MusicHistoryResult {\n  success: boolean\n  history: MusicTrack[]\n}\n\nexport interface MusicFavoritesResult {\n  success: boolean\n  favorites: MusicTrack[]\n}\n\nexport interface MusicTrack {"
)

discordApi = discordApi.replace(
    "  getMusicQueue: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {\n    const { data } = await api.get('/music/queue', { params: { guild_id: guildId, channel_id: channelId } })\n    return data\n  },",
    `  getMusicQueue: async (guildId: string, channelId: string): Promise<MusicQueueStatus> => {
    const { data } = await api.get('/music/queue', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  getHistory: async (guildId: string, channelId: string): Promise<MusicHistoryResult> => {
    const { data } = await api.get('/music/history', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  requeueHistory: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/history/requeue', { guildId, channelId, track })
    return data
  },

  getFavorites: async (guildId: string, channelId: string): Promise<MusicFavoritesResult> => {
    const { data } = await api.get('/music/favorites', { params: { guild_id: guildId, channel_id: channelId } })
    return data
  },

  addFavorite: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicFavoritesResult> => {
    const { data } = await api.post('/music/favorites', { guildId, channelId, track })
    return data
  },

  removeFavorite: async (guildId: string, channelId: string, encoded: string): Promise<MusicFavoritesResult> => {
    const { data } = await api.delete('/music/favorites', { data: { guildId, channelId, encoded } })
    return data
  },

  playFavorite: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/favorites/play', { guildId, channelId, track })
    return data
  },

  playNextFavorite: async (guildId: string, channelId: string, track: MusicTrack): Promise<MusicQueueStatus> => {
    const { data } = await api.post('/music/favorites/play-next', { guildId, channelId, track })
    return data
  },`
)

fs.writeFileSync('src/services/discordApi.ts', discordApi, 'utf8')
