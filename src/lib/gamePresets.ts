export interface GamePreset {
  id: string
  label: string
  channelName: string
  memberLimit: number
  createTextChannel: boolean
  createCategory: boolean
}

export const GAME_PRESETS: GamePreset[] = [
  {
    id: 'valorant',
    label: 'Valorant',
    channelName: 'valorant-squad',
    memberLimit: 5,
    createTextChannel: true,
    createCategory: true,
  },
  {
    id: 'minecraft',
    label: 'Minecraft',
    channelName: 'minecraft',
    memberLimit: 0,
    createTextChannel: true,
    createCategory: true,
  },
  {
    id: 'fortnite',
    label: 'Fortnite',
    channelName: 'fortnite-squad',
    memberLimit: 4,
    createTextChannel: true,
    createCategory: true,
  },
  {
    id: 'league',
    label: 'League',
    channelName: 'league-5v5',
    memberLimit: 5,
    createTextChannel: true,
    createCategory: true,
  },
  {
    id: 'cod',
    label: 'CoD',
    channelName: 'cod-lobby',
    memberLimit: 6,
    createTextChannel: true,
    createCategory: true,
  },
  {
    id: 'apex',
    label: 'Apex',
    channelName: 'apex-trio',
    memberLimit: 3,
    createTextChannel: true,
    createCategory: true,
  },
  {
    id: 'study',
    label: 'Study',
    channelName: 'study-room',
    memberLimit: 8,
    createTextChannel: true,
    createCategory: false,
  },
  {
    id: 'hangout',
    label: 'Hangout',
    channelName: 'hangout',
    memberLimit: 0,
    createTextChannel: true,
    createCategory: false,
  },
]
