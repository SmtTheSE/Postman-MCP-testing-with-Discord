const fs = require('fs')
let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')

// Fix missing imports
jukebox = jukebox.replace(
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio } from 'lucide-react'",
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, X, ArrowUp, ArrowDown, Shuffle, Trash2 } from 'lucide-react'\nimport { useQueuePolling } from '../hooks/useQueuePolling'"
)
fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
