const fs = require('fs')

let jukebox = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')

// Add imports
jukebox = jukebox.replace(
  "import { useQueuePolling } from '../hooks/useQueuePolling'",
  "import { useQueuePolling } from '../hooks/useQueuePolling'\nimport { useMusicStream, type StreamConnectionState } from '../hooks/useMusicStream'"
)
jukebox = jukebox.replace(
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2 } from 'lucide-react'",
  "import { Music2, Pause, Play, SkipForward, LogOut as LeaveIcon, Radio, Shuffle, Trash2, Clock, Star, RefreshCw, X, ArrowUp, ArrowDown } from 'lucide-react'"
)

// Add new state for activity log, history, favorites, UI tabs
jukebox = jukebox.replace(
  "  const [dismissedError, setDismissedError] = useState<string | null>(null)",
  `  const [dismissedError, setDismissedError] = useState<string | null>(null)
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'favorites'>('queue')
  const [history, setHistory] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)`
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

// Fetch history and favorites when tab changes
jukebox = jukebox.replace(
  "  const { addAlert } = useAlerts()",
  `  const { addAlert } = useAlerts()

  useEffect(() => {
    if (activeTab === 'history' && guildId && channelId) {
       setHistoryLoading(true)
       discordApi.getHistory(guildId, channelId).then(res => {
          setHistory(res.history)
       }).finally(() => setHistoryLoading(false))
    }
    if (activeTab === 'favorites' && guildId && channelId) {
       setFavoritesLoading(true)
       discordApi.getFavorites(guildId, channelId).then(res => {
          setFavorites(res.favorites)
       }).finally(() => setFavoritesLoading(false))
    }
  }, [activeTab, guildId, channelId])
`
)

// Add UI for connection state badge near Voice channel section title
jukebox = jukebox.replace(
  '<p className="ios-section-title">Voice channel</p>',
  `<div className="flex justify-between items-center pr-2">
            <p className="ios-section-title">Voice channel</p>
            {channelId && (
              <span className={\`text-[11px] font-medium px-2 py-0.5 rounded-full \${
                  connectionState === 'live' ? 'bg-green-100 text-green-700' :
                  connectionState === 'reconnecting' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
              }\`}>
                {connectionState === 'live' ? 'Live' : connectionState === 'reconnecting' ? 'Reconnecting...' : 'Polling'}
              </span>
            )}
          </div>`
)

// Add tabs and panels above Now Playing
jukebox = jukebox.replace(
  '<section>\n            <p className="ios-section-title">Now playing</p>',
  `
          {/* Live Activity (Compact) */}
          {activityLog.length > 0 && (
             <section className="mb-4">
                <p className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2 px-1">Live Activity</p>
                <div className="bg-white/60 rounded-xl p-3 shadow-sm border border-black/[0.05] max-h-[120px] overflow-y-auto space-y-2">
                   {activityLog.map((log, i) => (
                      <div key={i} className="flex items-center text-[13px]">
                         <span className="text-muted mr-2">{new Date(log.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                         <span className="font-semibold mr-1">{log.username}</span>
                         <span className="text-black/80">{log.action}</span>
                         {log.detail && <span className="text-muted ml-1 truncate">— {log.detail}</span>}
                      </div>
                   ))}
                </div>
             </section>
          )}

          <div className="flex gap-2 px-1 mb-3">
             <button onClick={() => setActiveTab('queue')} className={\`ios-btn-secondary py-1 px-3 text-xs \${activeTab === 'queue' ? 'bg-black text-white' : ''}\`}>Queue</button>
             <button onClick={() => setActiveTab('history')} className={\`ios-btn-secondary py-1 px-3 text-xs \${activeTab === 'history' ? 'bg-black text-white' : ''}\`}>History</button>
             <button onClick={() => setActiveTab('favorites')} className={\`ios-btn-secondary py-1 px-3 text-xs \${activeTab === 'favorites' ? 'bg-black text-white' : ''}\`}>Favorites</button>
          </div>

          <section>
            <p className="ios-section-title">{activeTab === 'queue' ? 'Now playing' : activeTab === 'history' ? 'Recently Played' : 'Your Favorites'}</p>
`
)

// Adjust rendering based on activeTab
jukebox = jukebox.replace(
  `              {status?.queue && status.queue.length > 0 && (
                <div className="jukebox-queue-block">
                  <p className="ios-section-title jukebox-queue-title">Up next ({status.queueLength})</p>
                  <div className="jukebox-queue">
                    {status.queue.map((track, i) => (
                      <TrackRow
                        key={\`\${track.encoded}-\${i}\`}
                        track={track}
                        index={i}
                        onRemove={() => runAction('Remove', async () => {
                            const res = await discordApi.removeTrack(guildId, channelId, i)
                            setStatus(res)
                            return res
                        })}
                        onMoveUp={i > 0 ? () => runAction('MoveUp', async () => {
                            const res = await discordApi.moveTrack(guildId, channelId, i, i - 1)
                            setStatus(res)
                            return res
                        }) : undefined}
                        onMoveDown={i < status.queue.length - 1 ? () => runAction('MoveDown', async () => {
                            const res = await discordApi.moveTrack(guildId, channelId, i, i + 1)
                            setStatus(res)
                            return res
                        }) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}`,
  `              {activeTab === 'queue' && status?.queue && status.queue.length > 0 && (
                <div className="jukebox-queue-block">
                  <p className="ios-section-title jukebox-queue-title">Up next ({status.queueLength})</p>
                  <div className="jukebox-queue">
                    {status.queue.map((track, i) => (
                      <TrackRow
                        key={\`\${track.encoded}-\${i}\`}
                        track={track}
                        index={i}
                        onRemove={() => runAction('Remove', async () => {
                            const res = await discordApi.removeTrack(guildId, channelId, i)
                            setStatus(res)
                            return res
                        })}
                        onMoveUp={i > 0 ? () => runAction('MoveUp', async () => {
                            const res = await discordApi.moveTrack(guildId, channelId, i, i - 1)
                            setStatus(res)
                            return res
                        }) : undefined}
                        onMoveDown={i < status.queue.length - 1 ? () => runAction('MoveDown', async () => {
                            const res = await discordApi.moveTrack(guildId, channelId, i, i + 1)
                            setStatus(res)
                            return res
                        }) : undefined}
                        onAddFav={() => runAction('AddFav', async () => {
                            await discordApi.addFavorite(guildId, channelId, track)
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                 <div className="jukebox-queue-block">
                    {historyLoading ? (
                       <p className="text-[14px] text-muted p-4">Loading history...</p>
                    ) : history.length === 0 ? (
                       <p className="text-[14px] text-muted p-4">No history yet.</p>
                    ) : (
                       <div className="jukebox-queue">
                          {history.map((track, i) => (
                             <TrackRow key={\`history-\${track.encoded}-\${i}\`} track={track} onRequeue={() => runAction('Requeue', async () => {
                                const res = await discordApi.requeueHistory(guildId, channelId, track)
                                setStatus(res)
                                setActiveTab('queue')
                             })} />
                          ))}
                       </div>
                    )}
                 </div>
              )}

              {activeTab === 'favorites' && (
                 <div className="jukebox-queue-block">
                    {favoritesLoading ? (
                       <p className="text-[14px] text-muted p-4">Loading favorites...</p>
                    ) : favorites.length === 0 ? (
                       <p className="text-[14px] text-muted p-4">No favorites saved.</p>
                    ) : (
                       <div className="jukebox-queue">
                          {favorites.map((track, i) => (
                             <TrackRow key={\`fav-\${track.encoded}-\${i}\`} track={track}
                               onRequeue={() => runAction('PlayFav', async () => {
                                  const res = await discordApi.playFavorite(guildId, channelId, track)
                                  setStatus(res)
                                  setActiveTab('queue')
                               })}
                               onRemove={() => runAction('RemoveFav', async () => {
                                  const res = await discordApi.removeFavorite(guildId, channelId, track.encoded)
                                  setFavorites(res.favorites)
                               })}
                             />
                          ))}
                       </div>
                    )}
                 </div>
              )}
`
)

// Make Now Playing area conditional on activeTab === 'queue'
jukebox = jukebox.replace(
  `            <div className="jukebox-card">
              <div className="jukebox-now-head">`,
  `            <div className="jukebox-card">
              {activeTab === 'queue' && (
                 <>
              <div className="jukebox-now-head">`
)

jukebox = jukebox.replace(
  `                <p className="text-[15px] text-muted leading-relaxed">
                  Nothing playing — join a channel and search for a track.
                </p>
              )}`,
  `                <p className="text-[15px] text-muted leading-relaxed">
                  Nothing playing — join a channel and search for a track.
                </p>
              )}

              <div className="mt-3 flex justify-end">
                {status?.nowPlaying && (
                  <button type="button" onClick={() => runAction('AddFav', async () => {
                      if (status.nowPlaying) await discordApi.addFavorite(guildId, channelId, status.nowPlaying)
                  })} className="text-xs font-medium text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded">
                     <Star className="w-3 h-3 mr-1" /> Save Favorite
                  </button>
                )}
              </div>

              </>
              )}`
)

// Update TrackRow to handle the new action buttons (Add Fav, Requeue)
jukebox = jukebox.replace(
  "function TrackRow({ track, label, index, onRemove, onMoveUp, onMoveDown }: { track: MusicTrack; label?: string; index?: number; onRemove?: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {",
  "function TrackRow({ track, label, index, onRemove, onMoveUp, onMoveDown, onAddFav, onRequeue }: { track: MusicTrack; label?: string; index?: number; onRemove?: () => void; onMoveUp?: () => void; onMoveDown?: () => void; onAddFav?: () => void; onRequeue?: () => void }) {"
)

jukebox = jukebox.replace(
  `              <button type="button" onClick={onRemove} className="text-red-500/70 hover:text-red-500 bg-red-500/10 rounded-full p-1.5 ml-1"><X className="w-4 h-4" /></button>
          </div>
      )}
    </div>`,
  `              <button type="button" onClick={onRemove} className="text-red-500/70 hover:text-red-500 bg-red-500/10 rounded-full p-1.5 ml-1"><X className="w-4 h-4" /></button>
          </div>
      )}

      {onRequeue && (
         <button type="button" onClick={onRequeue} className="ml-2 ios-btn-secondary py-1 px-2 text-[11px]">Play</button>
      )}
      {onAddFav && index !== undefined && (
         <button type="button" onClick={onAddFav} className="ml-1 text-amber-500/70 hover:text-amber-500"><Star className="w-4 h-4" /></button>
      )}
    </div>`
)

fs.writeFileSync('src/pages/JukeboxPage.tsx', jukebox, 'utf8')
