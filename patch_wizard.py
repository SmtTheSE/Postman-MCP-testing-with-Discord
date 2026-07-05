with open('src/hooks/useChannelWizard.ts', 'r') as f:
    content = f.read()

search = """
interface WizardState {
  step: 1 | 2 | 3
  gameName: string
  channelName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
  guildId: string
  guildName: string
}
"""

replace = """
interface WizardState {
  step: 1 | 2 | 3
  gameName: string
  channelName: string
  description: string
  memberLimit: number
  bitrate: number
  region: string
  guildId: string
  guildName: string
  createCategory: boolean
  createTextChannel: boolean
  maxAge: number
  maxUses: number
}
"""

content = content.replace(search.strip(), replace.strip())

search2 = """
const DEFAULT_REGIONS = [
"""

replace2 = """
const DEFAULT_MAX_AGES = [
  { label: 'Never', value: 0 },
  { label: '30 minutes', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '6 hours', value: 21600 },
  { label: '12 hours', value: 43200 },
  { label: '1 day', value: 86400 },
  { label: '7 days', value: 604800 },
]

const DEFAULT_MAX_USES = [
  { label: 'No limit', value: 0 },
  { label: '1 use', value: 1 },
  { label: '5 uses', value: 5 },
  { label: '10 uses', value: 10 },
  { label: '25 uses', value: 25 },
  { label: '50 uses', value: 50 },
  { label: '100 uses', value: 100 },
]

const DEFAULT_REGIONS = [
"""

content = content.replace(search2.strip(), replace2.strip())

search3 = """
const initialState: WizardState = {
  step: 1,
  gameName: '',
  channelName: '',
  description: '',
  memberLimit: 0,
  bitrate: 64000,
  region: '',
  guildId: '',
  guildName: '',
}
"""

replace3 = """
const initialState: WizardState = {
  step: 1,
  gameName: '',
  channelName: '',
  description: '',
  memberLimit: 0,
  bitrate: 64000,
  region: '',
  guildId: '',
  guildName: '',
  createCategory: false,
  createTextChannel: false,
  maxAge: 86400,
  maxUses: 0,
}
"""

content = content.replace(search3.strip(), replace3.strip())

search4 = """
    DEFAULT_BITRATES,
    DEFAULT_REGIONS,
"""

replace4 = """
    DEFAULT_BITRATES,
    DEFAULT_REGIONS,
    DEFAULT_MAX_AGES,
    DEFAULT_MAX_USES,
"""

content = content.replace(search4.strip(), replace4.strip())

with open('src/hooks/useChannelWizard.ts', 'w') as f:
    f.write(content)
