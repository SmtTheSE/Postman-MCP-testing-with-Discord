with open('src/components/Step1GameDetails.tsx', 'r') as f:
    content = f.read()

search = """
interface Step1Props {
  gameName: string
  channelName: string
  description: string
  onUpdate: (field: string, value: string) => void
  onNext: () => void
}

export function Step1GameDetails({ gameName, channelName, description, onUpdate, onNext }: Step1Props) {
"""

replace = """
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
"""

content = content.replace(search.strip(), replace.strip())

search2 = """
      </section>

      <div className="btn-stack">
"""

replace2 = """
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
"""

content = content.replace(search2.strip(), replace2.strip())

with open('src/components/Step1GameDetails.tsx', 'w') as f:
    f.write(content)
