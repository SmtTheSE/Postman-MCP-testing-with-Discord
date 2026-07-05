interface Step2Props {
  memberLimit: number
  bitrate: number
  region: string
  maxAge: number
  maxUses: number
  bitrates: { label: string; value: number }[]
  regions: { label: string; value: string }[]
  maxAges: { label: string; value: number }[]
  maxUsesList: { label: string; value: number }[]
  onUpdate: (field: string, value: number | string | boolean) => void
  onNext: () => void
  onBack: () => void
}

export function Step2VoiceSettings({
  memberLimit,
  bitrate,
  region,
  maxAge,
  maxUses,
  bitrates,
  regions,
  maxAges,
  maxUsesList,
  onUpdate,
  onNext,
  onBack,
}: Step2Props) {
  return (
    <div className="page-stack">
      <section>
        <p className="ios-section-title">Members</p>
        <div className="ios-group">
          <div className="ios-group-row">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[17px] text-black font-medium">Member limit</span>
              <span className="text-[17px] text-[#007AFF] font-semibold tabular-nums">
                {memberLimit === 0 ? 'No limit' : memberLimit}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={99}
              value={memberLimit}
              onChange={(e) => onUpdate('memberLimit', parseInt(e.target.value, 10))}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section>
        <p className="ios-section-title">Audio quality</p>
        <div className="segmented">
          {bitrates.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => onUpdate('bitrate', b.value)}
              className={`segmented-btn ${bitrate === b.value ? 'segmented-btn-active' : ''}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="ios-section-title">Region</p>
        <div className="ios-group">
          <div className="ios-group-row flex items-center justify-between gap-4">
            <span className="text-[17px] text-black font-medium shrink-0">Server region</span>
            <select
              value={region}
              onChange={(e) => onUpdate('region', e.target.value)}
              className="ios-input text-right text-[#007AFF] font-semibold max-w-[55%]"
            >
              {regions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <p className="ios-section-title">Invite Link</p>
        <div className="ios-group">
          <div className="ios-group-row flex items-center justify-between gap-4">
            <span className="text-[17px] text-black font-medium shrink-0">Expire after</span>
            <select
              value={maxAge}
              onChange={(e) => onUpdate('maxAge', parseInt(e.target.value, 10))}
              className="ios-input text-right text-[#007AFF] font-semibold max-w-[55%]"
            >
              {maxAges.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ios-group-row flex items-center justify-between gap-4">
            <span className="text-[17px] text-black font-medium shrink-0">Max uses</span>
            <select
              value={maxUses}
              onChange={(e) => onUpdate('maxUses', parseInt(e.target.value, 10))}
              className="ios-input text-right text-[#007AFF] font-semibold max-w-[55%]"
            >
              {maxUsesList.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="btn-stack">
        <button type="button" onClick={onNext} className="ios-btn-primary">
          Continue
        </button>
        <button type="button" onClick={onBack} className="ios-btn-secondary">
          Back
        </button>
      </div>
    </div>
  )
}
