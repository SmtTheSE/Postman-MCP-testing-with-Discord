const fs = require('fs')
let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')
jukebox = jukebox.replace(
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Clock, Star, RefreshCw, X, ArrowUp, ArrowDown } from 'lucide-react'",
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Star, X, ArrowUp, ArrowDown } from 'lucide-react'"
)
fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
