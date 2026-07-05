with open('src/services/discordApi.ts', 'r') as f:
    content = f.read()

search = """
export interface CreateChannelParams {
  guildId: string
  channelName: string
  gameName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
}
"""

replace = """
export interface CreateChannelParams {
  guildId: string
  channelName: string
  gameName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
  createCategory: boolean
  createTextChannel: boolean
  maxAge: number
  maxUses: number
}
"""

content = content.replace(search.strip(), replace.strip())

with open('src/services/discordApi.ts', 'w') as f:
    f.write(content)
