const fs = require('fs')

let service = fs.readFileSync('lib/music/service.js', 'utf8')
service = service.replace('getPlaybackError,', '')
service = service.replace('const session = getSession(guildId, channelId)', '')
service = service.replace('catch (e) {', 'catch (_e) {').replace('catch (e) {', 'catch (_e) {')
fs.writeFileSync('lib/music/service.js', service, 'utf8')

let queue = fs.readFileSync('lib/music/queue.js', 'utf8')
queue = queue.replace('saveGuildState, ', '')
fs.writeFileSync('lib/music/queue.js', queue, 'utf8')

let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')
jukebox = jukebox.replace('index, onRemove, onMoveUp, onMoveDown', 'index: _index, onRemove: _onRemove, onMoveUp: _onMoveUp, onMoveDown: _onMoveDown')
jukebox = jukebox.replace(
  "import { Play, Pause, SkipForward, Radio, LogOut as LeaveIcon, X, ArrowUp, ArrowDown, Shuffle, Repeat, RefreshCw, Trash2 } from 'lucide-react'",
  "import { Play, Pause, SkipForward, Radio, LogOut as LeaveIcon, X, ArrowUp, ArrowDown, Shuffle, Repeat, RefreshCw, Trash2 } from 'lucide-react'"
)
fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
