const fs = require('fs')
let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')

// Re-add the missing imports
jukebox = jukebox.replace(
  "import { Play, Pause, SkipForward, Radio, LogOut as LeaveIcon, X, ArrowUp, ArrowDown, Shuffle, Repeat, RefreshCw, Trash2 } from 'lucide-react'",
  "import { Play, Pause, SkipForward, Radio, LogOut as LeaveIcon, X, ArrowUp, ArrowDown, Shuffle, Trash2 } from 'lucide-react'"
)
fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
