interface Step1Props {
  gameName: string
  channelName: string
  description: string
  onUpdate: (field: string, value: string) => void
  onNext: () => void
}

export function Step1GameDetails({ gameName, channelName, description, onUpdate, onNext }: Step1Props) {
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

      <div className="btn-stack">
        <button type="button" onClick={onNext} disabled={!canProceed} className="ios-btn-primary">
          Continue
        </button>
      </div>
    </div>
  )
}
