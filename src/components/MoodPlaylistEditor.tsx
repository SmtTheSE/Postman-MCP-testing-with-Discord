import { useEffect, useState } from 'react'
import { useAlerts } from '../context/AlertContext'
import { discordApi, type MoodPlaylist } from '../services/discordApi'

const MOOD_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'chill', label: 'Chill' },
  { value: 'nightcore', label: 'Nightcore' },
  { value: 'bassboost', label: 'Bass Boost' },
  { value: '8d', label: '8D' },
]

const emptyDraft = (): Omit<MoodPlaylist, 'custom'> => ({
  id: '',
  label: '',
  mood: 'normal',
  search: '',
  trackCount: 5,
})

export function MoodPlaylistEditor({
  guildId,
  busy,
  onPlaylistsChange,
  onSelectPlaylist,
}: {
  guildId: string
  busy: boolean
  onPlaylistsChange: (playlists: MoodPlaylist[]) => void
  onSelectPlaylist: (id: string) => void
}) {
  const { showToast } = useAlerts()
  const [open, setOpen] = useState(false)
  const [customPlaylists, setCustomPlaylists] = useState<MoodPlaylist[]>([])
  const [draft, setDraft] = useState(emptyDraft())

  useEffect(() => {
    if (!guildId) {
      setCustomPlaylists([])
      return
    }
    discordApi.listMoodPlaylists(guildId).then((res) => {
      const custom = (res.playlists || []).filter((p) => p.custom)
      setCustomPlaylists(custom)
      onPlaylistsChange(res.playlists || [])
    }).catch(() => setCustomPlaylists([]))
  }, [guildId, onPlaylistsChange])

  const resetDraft = () => setDraft(emptyDraft())

  const savePlaylist = async () => {
    if (!guildId || !draft.label.trim() || !draft.search.trim()) return
    try {
      const res = await discordApi.saveMoodPlaylist(guildId, {
        id: draft.id || undefined,
        label: draft.label.trim(),
        mood: draft.mood,
        search: draft.search.trim(),
        trackCount: draft.trackCount,
      })
      onPlaylistsChange(res.playlists)
      setCustomPlaylists(res.playlists.filter((p) => p.custom))
      onSelectPlaylist(res.playlist.id)
      resetDraft()
      showToast({ title: 'Saved', message: res.playlist.label, variant: 'success' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not save playlist'
      showToast({ title: 'Save failed', message: msg, variant: 'error' })
    }
  }

  const deletePlaylist = async (id: string) => {
    if (!guildId) return
    try {
      const res = await discordApi.deleteMoodPlaylist(guildId, id)
      onPlaylistsChange(res.playlists)
      setCustomPlaylists(res.playlists.filter((p) => p.custom))
      if (draft.id === id) resetDraft()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not delete playlist'
      showToast({ title: 'Delete failed', message: msg, variant: 'error' })
    }
  }

  return (
    <div className="jukebox-mood-editor">
      <button
        type="button"
        className="jukebox-mood-editor-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide playlist editor' : 'Edit guild mood playlists'}
      </button>

      {open && (
        <div className="jukebox-mood-editor-panel">
          <p className="jukebox-section-hint">
            Custom playlists are saved for this server only. Built-in presets cannot be edited here.
          </p>

          {customPlaylists.length > 0 && (
            <ul className="jukebox-mood-editor-list">
              {customPlaylists.map((p) => (
                <li key={p.id} className="jukebox-mood-editor-item">
                  <button
                    type="button"
                    className="jukebox-mood-editor-item-label"
                    disabled={busy}
                    onClick={() => setDraft({ id: p.id, label: p.label, mood: p.mood, search: p.search, trackCount: p.trackCount })}
                  >
                    {p.label}
                  </button>
                  <button
                    type="button"
                    className="jukebox-mood-editor-delete"
                    disabled={busy}
                    onClick={() => deletePlaylist(p.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="jukebox-mood-editor-form">
            <input
              className="ios-input manage-input"
              placeholder="Playlist name"
              value={draft.label}
              disabled={busy}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            />
            <input
              className="ios-input manage-input"
              placeholder="YouTube search query"
              value={draft.search}
              disabled={busy}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
            />
            <div className="jukebox-mood-editor-form-row">
              <select
                className="jukebox-select manage-input jukebox-settings-select"
                value={draft.mood}
                disabled={busy}
                onChange={(e) => setDraft((d) => ({ ...d, mood: e.target.value }))}
              >
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                className="ios-input manage-input jukebox-mood-count"
                value={draft.trackCount}
                disabled={busy}
                onChange={(e) => setDraft((d) => ({ ...d, trackCount: Number(e.target.value) || 5 }))}
              />
            </div>
            <div className="jukebox-mood-editor-actions">
              <button
                type="button"
                className="ios-btn-primary"
                disabled={busy || !draft.label.trim() || !draft.search.trim()}
                onClick={savePlaylist}
              >
                {draft.id ? 'Save changes' : 'Add playlist'}
              </button>
              {draft.id && (
                <button type="button" className="ios-btn-secondary" disabled={busy} onClick={resetDraft}>
                  New playlist
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
