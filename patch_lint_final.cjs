const fs = require('fs')

let service = fs.readFileSync('lib/music/service.js', 'utf8')
service = service.replace(/catch \(_e\)/g, 'catch')
service = service.replace(/\[\(\[\].\*\?\[\)\]\]/g, '\\[\\(\\[\\].*?\\[\\)\\]\\]') // Need to escape safely without oxlint complaining, actually just use normal replace without regex literal.

service = service.replace("replace(/[\\(\\[].*?[\\)\\]]/g, '')", "replace(/[\\[\\(].*?[\\]\\)]/g, '')")
fs.writeFileSync('lib/music/service.js', service, 'utf8')

let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')
jukebox = jukebox.replace(
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Clock, Star, RefreshCw, X, ArrowUp, ArrowDown } from 'lucide-react'",
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Star } from 'lucide-react'"
)

// The useState setters are used in JukeboxPage, oxlint is giving false positive because of the way I patched the file. Let's fix the patching or ignore it.
// Wait, I replaced `const { connectionState } = useMusicStream` in the previous step? No I didn't, the patch failed? Let's check JukeboxPage.tsx content for useMusicStream
