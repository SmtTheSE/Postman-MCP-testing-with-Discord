import { useEffect, useRef, useState } from 'react'
import type { MusicQueueStatus } from '../services/discordApi'

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

/** Skip React updates when SSE payload is unchanged (avoids render storms). */
export function musicStatusChanged(a: MusicQueueStatus | null, b: MusicQueueStatus): boolean {
  if (!a) return true
  if (a.state !== b.state) return true
  if (a.paused !== b.paused) return true
  if (a.connected !== b.connected) return true
  if (a.queueLength !== b.queueLength) return true
  if (a.playbackError !== b.playbackError) return true
  if (a.nowPlaying?.encoded !== b.nowPlaying?.encoded) return true
  if (a.settings?.repeat !== b.settings?.repeat) return true
  if (a.settings?.autoplay !== b.settings?.autoplay) return true
  if (a.lavalinkUdpConnected !== b.lavalinkUdpConnected) return true
  if (a.lavalinkHasTrack !== b.lavalinkHasTrack) return true
  if (a.queue.length !== b.queue.length) return true
  if (b.queue.length > 0 && a.queue[0]?.encoded !== b.queue[0]?.encoded) return true
  return false
}

export function useMusicStream({ guildId, channelId, isActive, onUpdate, onActionLog }: UseMusicStreamProps) {
  const [connectionState, setConnectionState] = useState<StreamConnectionState>('offline')
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onUpdateRef = useRef(onUpdate)
  const onActionLogRef = useRef(onActionLog)

  onUpdateRef.current = onUpdate
  onActionLogRef.current = onActionLog

  useEffect(() => {
    if (!guildId || !channelId || !isActive) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      setConnectionState('offline')
      return
    }

    let isMounted = true

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
      }

      es.onerror = () => {
        if (!isMounted) return
        cleanup()
        setConnectionState('reconnecting')
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }

      es.addEventListener('connected', (e: MessageEvent) => {
        if (!isMounted) return
        try {
          onUpdateRef.current(JSON.parse(e.data))
        } catch {
          console.error('[useMusicStream] failed to parse connected event')
        }
      })

      es.addEventListener('queue_updated', (e: MessageEvent) => {
        if (!isMounted) return
        try {
          onUpdateRef.current(JSON.parse(e.data))
        } catch {
          console.error('[useMusicStream] failed to parse queue_updated event')
        }
      })

      es.addEventListener('action_log', (e: MessageEvent) => {
        if (!isMounted) return
        try {
          onActionLogRef.current?.(JSON.parse(e.data))
        } catch {
          console.error('[useMusicStream] failed to parse action_log event')
        }
      })

      es.addEventListener('heartbeat', () => {})
    }

    connect()

    return () => {
      isMounted = false
      cleanup()
    }
  }, [guildId, channelId, isActive])

  return { connectionState }
}
