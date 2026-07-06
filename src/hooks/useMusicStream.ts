import { useEffect, useRef, useState } from 'react'
import type { MusicQueueStatus } from '../services/discordApi'
import { discordApi } from '../services/discordApi'

export type StreamConnectionState = 'live' | 'reconnecting' | 'offline'

interface ActionLogEvent {
  at: number
  userId: string
  username: string
  action: string
  detail?: string
}

interface UseMusicStreamProps {
  guildId: string | null
  channelId: string | null
  isActive: boolean
  onUpdate: (status: MusicQueueStatus) => void
  onActionLog?: (log: ActionLogEvent) => void
}

export function useMusicStream({ guildId, channelId, isActive, onUpdate, onActionLog }: UseMusicStreamProps) {
  const [connectionState, setConnectionState] = useState<StreamConnectionState>('offline')
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!guildId || !channelId || !isActive) {
      cleanup()
      setConnectionState('offline')
      return
    }

    let isMounted = true

    function connect() {
      if (!isMounted) return
      cleanup()
      setConnectionState('reconnecting')

      const url = `/api/music/stream?guild_id=${guildId}&channel_id=${channelId}`
      const es = new EventSource(url, { withCredentials: true })
      eventSourceRef.current = es

      es.onopen = () => {
        if (!isMounted) return
        setConnectionState('live')
        console.log('[useMusicStream] connected')
      }

      es.onerror = () => {
        if (!isMounted) return
        console.warn('[useMusicStream] connection error, reconnecting...')
        cleanup()
        setConnectionState('reconnecting')
        // Fallback or reconnect delay
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }

      es.addEventListener('connected', (_e: MessageEvent) => {
        if (!isMounted) return
        try {
          const data = JSON.parse(e.data)
          onUpdate(data)
        } catch {
          console.error('[useMusicStream] failed to parse connected event', err)
        }
      })

      es.addEventListener('queue_updated', (_e: MessageEvent) => {
        if (!isMounted) return
        try {
          const data = JSON.parse(e.data)
          onUpdate(data)
        } catch {
          console.error('[useMusicStream] failed to parse queue_updated event', err)
        }
      })

      es.addEventListener('now_playing_changed', (_e: MessageEvent) => {
        if (!isMounted) return
        try {
          // Trigger a full fetch via API when this happens to ensure sync
          discordApi.getMusicQueue(guildId || '', channelId || '').then(data => {
              if (isMounted) onUpdate(data)
          }).catch(() => {})
        } catch {}
      })

      es.addEventListener('settings_changed', (_e: MessageEvent) => {
         // Same here, trigger full poll to be safe and simple
         if (isMounted) {
            discordApi.getMusicQueue(guildId || '', channelId || '').then(data => {
               if (isMounted) onUpdate(data)
            }).catch(() => {})
         }
      })

      es.addEventListener('playback_error', (_e: MessageEvent) => {
         if (isMounted) {
            discordApi.getMusicQueue(guildId || '', channelId || '').then(data => {
               if (isMounted) onUpdate(data)
            }).catch(() => {})
         }
      })

      es.addEventListener('action_log', (_e: MessageEvent) => {
        if (!isMounted || !onActionLog) return
        try {
          const data = JSON.parse(e.data)
          onActionLog(data)
        } catch {}
      })

      es.addEventListener('heartbeat', () => {
          // just ignore, keeps connection alive
      })
    }

    function cleanup() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    connect()

    return () => {
      isMounted = false
      cleanup()
    }
  }, [guildId, channelId, isActive, onUpdate, onActionLog])

  return { connectionState }
}
