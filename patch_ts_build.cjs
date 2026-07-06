const fs = require('fs')

let useQueuePolling = fs.readFileSync('src/hooks/useQueuePolling.ts', 'utf8')
useQueuePolling = useQueuePolling.replace("import { discordApi, MusicQueueStatus } from '../services/discordApi'", "import { discordApi, type MusicQueueStatus } from '../services/discordApi'")
useQueuePolling = useQueuePolling.replace("timeoutRef = useRef<NodeJS.Timeout | null>(null)", "timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)")
fs.writeFileSync('src/hooks/useQueuePolling.ts', useQueuePolling, 'utf8')

let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')
jukebox = jukebox.replace(
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, X, ArrowUp, ArrowDown, Shuffle, Trash2 } from 'lucide-react'\nimport { useQueuePolling } from '../hooks/useQueuePolling'",
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2 } from 'lucide-react'"
)
jukebox = jukebox.replace("onClick={() => setDismissedError(status.playbackError)}", "onClick={() => setDismissedError(status.playbackError || null)}")
jukebox = jukebox.replace("setStatus({ connected: false, nowPlaying: null, queue: [], paused: false, queueLength: 0 })", "setStatus({ connected: false, nowPlaying: null, queue: [], paused: false, queueLength: 0, state: 'idle' })")
fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
