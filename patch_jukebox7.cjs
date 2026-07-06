const fs = require('fs')

let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')

// Add imports
jukebox = jukebox.replace(
  "import { useQueuePolling } from '../hooks/useQueuePolling'",
  "import { useQueuePolling } from '../hooks/useQueuePolling'\nimport { useMusicStream, type StreamConnectionState } from '../hooks/useMusicStream'"
)

// Add useMusicStream hook usage
jukebox = jukebox.replace(
  `  useQueuePolling({
    guildId,
    channelId,
    isActive: !!guildId && !!channelId,
    status,
    onUpdate: (newStatus) => {
      // Don't update if we are busy to avoid overriding optimistic UI
      if (!busy) {
         setStatus(newStatus)
      }
    }
  })`,
  `  const { connectionState } = useMusicStream({
    guildId,
    channelId,
    isActive: !!guildId && !!channelId,
    onUpdate: (newStatus) => {
      if (!busy) setStatus(newStatus)
    },
    onActionLog: (log) => {
      setActivityLog(prev => [log, ...prev].slice(0, 10))
    }
  })

  useQueuePolling({
    guildId,
    channelId,
    isActive: !!guildId && !!channelId,
    isSSELive: connectionState === 'live',
    status,
    onUpdate: (newStatus) => {
      if (!busy) setStatus(newStatus)
    }
  })
`
)

fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
