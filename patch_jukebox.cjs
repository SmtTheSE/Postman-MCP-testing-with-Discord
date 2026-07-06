const fs = require('fs')

let content = fs.readFileSync('src/pages/JukeboxPage.tsx', 'utf8')

// Add imports
content = content.replace(
  "import { Play, Pause, SkipForward, Radio, LogOut as LeaveIcon } from 'lucide-react'",
  "import { Play, Pause, SkipForward, Radio, LogOut as LeaveIcon, X, ArrowUp, ArrowDown, Shuffle, Repeat, RefreshCw, Trash2 } from 'lucide-react'\nimport { useQueuePolling } from '../hooks/useQueuePolling'"
)

// Add new state hook near setStatus
content = content.replace(
  "const [status, setStatus] = useState<MusicQueueStatus | null>(null)",
  "const [status, setStatus] = useState<MusicQueueStatus | null>(null)\n  const [dismissedError, setDismissedError] = useState<string | null>(null)"
)

// Add the polling hook logic
content = content.replace(
  "  useEffect(() => {\n    if (!guildId || !channelId) return",
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
  })

  useEffect(() => {
    if (!guildId || !channelId) return`
)

// Clear dismissed error when playback error changes to something new, or on successful actions
content = content.replace(
  `  const runAction = async (name: string, fn: () => Promise<MusicQueueStatus | void>) => {`,
  `  const runAction = async (name: string, fn: () => Promise<MusicQueueStatus | void>) => {
    setDismissedError(null)`
)

// Make Jukebox error banner
content = content.replace(
  `      {guildId && (`,
  `      {guildId && channelId && status?.playbackError && status.playbackError !== dismissedError && (
        <CustomAlert variant="error" title="Playback Error">
          <div className="flex items-center justify-between">
            <span className="text-sm">{status.playbackError}</span>
            <button type="button" onClick={() => setDismissedError(status.playbackError)} className="text-[#007AFF] text-sm underline font-semibold ml-4 shrink-0">Dismiss</button>
          </div>
        </CustomAlert>
      )}

      {guildId && (`
)

// Toolbar with new controls + playnext
content = content.replace(
  `                <button
                  type="button"
                  className="ios-btn-primary jukebox-play-btn"
                  disabled={!query.trim() || busy !== null}
                  onClick={() => playQuery(query)}
                  aria-label="Play"
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>`,
  `                <button
                  type="button"
                  className="ios-btn-primary jukebox-play-btn"
                  disabled={!query.trim() || busy !== null}
                  onClick={() => playQuery(query)}
                  aria-label="Play"
                >
                  <Play className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    className="ios-btn-secondary py-1.5 px-3 text-xs flex-1 min-w-[100px]"
                    disabled={!query.trim() || busy !== null}
                    onClick={() =>
                      runAction('PlayNext', async () => {
                        const res = await discordApi.playNextMusic(guildId, channelId, query)
                        setStatus(res)
                        setQuery('')
                        return res
                      })
                    }
                  >
                    Play Next
                  </button>
                  <button
                    type="button"
                    className="ios-btn-secondary py-1.5 px-3 text-xs flex-1 min-w-[100px]"
                    disabled={busy !== null || status?.queueLength === 0}
                    onClick={() =>
                      runAction('Shuffle', async () => {
                        const res = await discordApi.shuffleQueue(guildId, channelId)
                        setStatus(res)
                        return res
                      })
                    }
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1" /> Shuffle
                  </button>
                  <button
                    type="button"
                    className="ios-btn-secondary py-1.5 px-3 text-xs flex-1 min-w-[100px]"
                    disabled={busy !== null}
                    onClick={() =>
                      runAction('Clear', async () => {
                        const res = await discordApi.clearQueue(guildId, channelId, true)
                        setStatus(res)
                        return res
                      })
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                  </button>
              </div>

              <div className="flex gap-3 mt-3 items-center justify-between text-sm bg-black/[0.03] p-2 rounded-xl">
                 <div className="flex items-center gap-2">
                     <span className="text-muted font-medium ml-1">Repeat:</span>
                     <select
                       className="jukebox-select manage-input text-xs py-1"
                       value={status?.settings?.repeat || 'off'}
                       onChange={(e) => {
                          runAction('Repeat', async () => {
                             const res = await discordApi.repeatMusic(guildId, channelId, e.target.value as any)
                             setStatus(res)
                             return res
                          })
                       }}
                       disabled={busy !== null}
                     >
                        <option value="off">Off</option>
                        <option value="track">Track</option>
                        <option value="queue">Queue</option>
                     </select>
                 </div>
                 <div className="flex items-center gap-2 mr-1">
                     <label className="flex items-center gap-2 cursor-pointer text-muted font-medium">
                         <input
                           type="checkbox"
                           checked={status?.settings?.autoplay || false}
                           disabled={busy !== null}
                           onChange={(e) => {
                              runAction('Autoplay', async () => {
                                 const res = await discordApi.autoplayMusic(guildId, channelId, e.target.checked)
                                 setStatus(res)
                                 return res
                              })
                           }}
                           className="w-4 h-4 rounded text-[#007AFF] focus:ring-[#007AFF]"
                         />
                         Autoplay
                     </label>
                 </div>
              </div>`
)

// Update TrackRow signature and Add queue controls
content = content.replace(
  "function TrackRow({ track, label }: { track: MusicTrack; label?: string }) {",
  "function TrackRow({ track, label, index, onRemove, onMoveUp, onMoveDown }: { track: MusicTrack; label?: string; index?: number; onRemove?: () => void; onMoveUp?: () => void; onMoveDown?: () => void }) {"
)

content = content.replace(
  `    <div className="jukebox-track">
      {thumb && <img src={thumb} alt="" className="jukebox-track-thumb" />}
      <div className="jukebox-track-meta min-w-0">`,
  `    <div className="jukebox-track items-center pr-2">
      {thumb && <img src={thumb} alt="" className="jukebox-track-thumb" />}
      <div className="jukebox-track-meta min-w-0 flex-1">`
)

content = content.replace(
  `        {label && <p className="jukebox-track-status">{label}</p>}
      </div>
    </div>`,
  `        {label && <p className="jukebox-track-status">{label}</p>}
      </div>

      {index !== undefined && (
          <div className="flex items-center gap-1.5 ml-2">
              <div className="flex flex-col gap-1">
                  <button type="button" disabled={!onMoveUp} onClick={onMoveUp} className="text-black/30 hover:text-black/60 disabled:opacity-30 disabled:hover:text-black/30 bg-black/5 rounded p-0.5"><ArrowUp className="w-3 h-3" /></button>
                  <button type="button" disabled={!onMoveDown} onClick={onMoveDown} className="text-black/30 hover:text-black/60 disabled:opacity-30 disabled:hover:text-black/30 bg-black/5 rounded p-0.5"><ArrowDown className="w-3 h-3" /></button>
              </div>
              <button type="button" onClick={onRemove} className="text-red-500/70 hover:text-red-500 bg-red-500/10 rounded-full p-1.5 ml-1"><X className="w-4 h-4" /></button>
          </div>
      )}
    </div>`
)

content = content.replace(
  `                    {status.queue.map((track, i) => (
                      <TrackRow key={\`\${track.encoded}-\${i}\`} track={track} />
                    ))}`,
  `                    {status.queue.map((track, i) => (
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
                    ))}`
)


fs.writeFileSync('src/pages/JukeboxPage.tsx', content, 'utf8')
