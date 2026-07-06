const fs = require('fs')

let useQueuePolling = fs.readFileSync('src/hooks/useQueuePolling.ts', 'utf8')
useQueuePolling = useQueuePolling.replace("isActive: boolean\n    isSSELive?: boolean", "isActive: boolean\n  isSSELive?: boolean")
useQueuePolling = useQueuePolling.replace("interface UseQueuePollingProps {", "export interface UseQueuePollingProps {")
fs.writeFileSync('src/hooks/useQueuePolling.ts', useQueuePolling, 'utf8')

let jb = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')
jb = jb.replace("const [activityLog, setActivityLog] = useState<any[]>([])", "const [activityLog, _setActivityLog] = useState<any[]>([])")
jb = jb.replace("const [history, setHistory] = useState<any[]>([])", "const [history, _setHistory] = useState<any[]>([])")
jb = jb.replace("const [historyLoading, setHistoryLoading] = useState(false)", "const [historyLoading, _setHistoryLoading] = useState(false)")
jb = jb.replace("const [favoritesLoading, setFavoritesLoading] = useState(false)", "const [favoritesLoading, _setFavoritesLoading] = useState(false)")
jb = jb.replace("import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Star, X, ArrowUp, ArrowDown } from 'lucide-react'", "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Star } from 'lucide-react'")

fs.writeFileSync('src/pages/JukeboxPage.tsx', jb, 'utf8')

let stream = fs.readFileSync('src/hooks/useMusicStream.ts', 'utf8')
stream = stream.replace(/discordApi\.getMusicQueue\(guildId, channelId\)/g, "discordApi.getMusicQueue(guildId || '', channelId || '')")
stream = stream.replace(/\(e: MessageEvent\)/g, "(_e: MessageEvent)")
fs.writeFileSync('src/hooks/useMusicStream.ts', stream, 'utf8')
