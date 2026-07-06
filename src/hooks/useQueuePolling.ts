import { useEffect, useRef } from 'react'
import type { MusicQueueStatus } from '../services/discordApi'
import { discordApi } from '../services/discordApi'

export interface UseQueuePollingProps {
  guildId: string | null
  channelId: string | null
  isActive: boolean
  isSSELive?: boolean
  playbackState?: MusicQueueStatus['state']
  onUpdate: (status: MusicQueueStatus) => void
}

export function useQueuePolling({
  guildId,
  channelId,
  isActive,
  isSSELive,
  playbackState,
  onUpdate,
}: UseQueuePollingProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFetchingRef = useRef(false)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    if (!guildId || !channelId || !isActive || isSSELive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    let isMounted = true

    const poll = async () => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      try {
        const updatedStatus = await discordApi.getMusicQueue(guildId, channelId)
        if (isMounted) {
          onUpdateRef.current(updatedStatus)
        }
      } catch (err) {
        console.warn('[useQueuePolling] failed to poll queue:', err)
      } finally {
        isFetchingRef.current = false
      }

      if (isMounted) {
        scheduleNextPoll()
      }
    }

    const scheduleNextPoll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      const interval = playbackState === 'playing' ? 8000 : 15000
      timeoutRef.current = setTimeout(poll, interval)
    }

    scheduleNextPoll()

    return () => {
      isMounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [guildId, channelId, isActive, isSSELive, playbackState])
}
