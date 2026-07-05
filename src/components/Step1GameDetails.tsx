interface Step1Props {
  gameName: string
  channelName: string
  description: string
  createCategory: boolean
  createTextChannel: boolean
  onUpdate: (field: string, value: string | boolean) => void
  onNext: () => void
}

export function Step1GameDetails({ gameName, channelName, description, createCategory, createTextChannel, onUpdate, onNext }: Step1Props) {
  const canProceed = gameName.trim() && channelName.trim()

  return (
    <div className="page-stack">
      <section>
        <p className="ios-section-title">Channel details</p>
        <div className="ios-group">
          <div className="ios-group-row">
            <label className="ios-label">Game</label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => onUpdate('gameName', e.target.value)}
              placeholder="Valorant, Minecraft…"
              className="ios-input"
            />
          </div>
          <div className="ios-group-row">
            <label className="ios-label">Channel name</label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => onUpdate('channelName', e.target.value)}
              placeholder="Late night squad"
              className="ios-input"
            />
          </div>
          <div className="ios-group-row">
            <label className="ios-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Optional — shown as channel topic"
              rows={3}
              className="ios-input resize-none"
            />
          </div>
        </div>
      </section>

      <section>
        <p className="ios-section-title">Extras</p>
        <div className="ios-group">
          <div className="ios-group-row flex items-center justify-between gap-4">
            <div>
              <span className="text-[17px] text-black font-medium block">Add text chat</span>
              <span className="text-[13px] text-[#8E8E93] block mt-0.5">Creates a matching #text-channel</span>
            </div>
            <input
              type="checkbox"
              className="ios-toggle"
              checked={createTextChannel}
              onChange={(e) => onUpdate('createTextChannel', e.target.checked)}
            />
          </div>
          <div className="ios-group-row flex items-center justify-between gap-4">
            <div>
              <span className="text-[17px] text-black font-medium block">Group in category</span>
              <span className="text-[13px] text-[#8E8E93] block mt-0.5">Keeps the new channels organized</span>
            </div>
            <input
              type="checkbox"
              className="ios-toggle"
              checked={createCategory}
              onChange={(e) => onUpdate('createCategory', e.target.checked)}
            />
          </div>
        </div>
      </section>

      <div className="btn-stack">
        <button type="button" onClick={onNext} disabled={!canProceed} className="ios-btn-primary">
          Continue
        </button>
      </div>
    </div>
  )
}
