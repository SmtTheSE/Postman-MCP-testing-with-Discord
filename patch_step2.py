with open('src/components/Step2VoiceSettings.tsx', 'r') as f:
    content = f.read()

search = """
interface Step2Props {
  memberLimit: number
  bitrate: number
  region: string
  bitrates: { label: string; value: number }[]
  regions: { label: string; value: string }[]
  onUpdate: (field: string, value: number | string) => void
  onNext: () => void
  onBack: () => void
}

export function Step2VoiceSettings({
  memberLimit,
  bitrate,
  region,
  bitrates,
  regions,
  onUpdate,
  onNext,
  onBack,
}: Step2Props) {
"""

replace = """
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
  onUpdate: (field: string, value: number | string) => void
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
"""

content = content.replace(search.strip(), replace.strip())


search2 = """
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

      <div className="btn-stack">
"""

replace2 = """
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
"""

content = content.replace(search2.strip(), replace2.strip())

with open('src/components/Step2VoiceSettings.tsx', 'w') as f:
    f.write(content)
