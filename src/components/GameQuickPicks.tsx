import { GAME_PRESETS, type GamePreset } from '../lib/gamePresets'

interface GameQuickPicksProps {
  selectedGame: string
  onSelect: (preset: GamePreset) => void
}

export function GameQuickPicks({ selectedGame, onSelect }: GameQuickPicksProps) {
  return (
    <section>
      <p className="ios-section-title">Quick pick</p>
      <div className="game-chip-grid">
        {GAME_PRESETS.map((preset) => {
          const active =
            selectedGame.trim().toLowerCase() === preset.label.toLowerCase() ||
            selectedGame.trim().toLowerCase() === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={`game-chip ${active ? 'game-chip-active' : ''}`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
