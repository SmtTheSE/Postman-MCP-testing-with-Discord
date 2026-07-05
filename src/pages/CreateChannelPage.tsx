import { useApp } from '../context/AppContext'
import { Step1GameDetails } from '../components/Step1GameDetails'
import { Step2VoiceSettings } from '../components/Step2VoiceSettings'
import { Step3GuildPrompt } from '../components/Step3GuildPrompt'
import { JoinLinkShare } from '../components/JoinLinkShare'
import { Alert } from '../components/ui/Alert'

export function CreateChannelPage() {
  const { wizard, result, isSubmitting, error, submitChannel, clearResult } = useApp()
  const { state, updateField, nextStep, prevStep } = wizard

  if (result) {
    return (
      <JoinLinkShare
        inviteUrl={result.inviteUrl}
        channelName={state.channelName}
        gameName={state.gameName}
        onCreateAnother={clearResult}
      />
    )
  }

  return (
    <>
      {error && (
        <div className="mb-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {state.step === 1 && (
        <Step1GameDetails
          gameName={state.gameName}
          channelName={state.channelName}
          description={state.description}
          onUpdate={updateField}
          onNext={nextStep}
        />
      )}
      {state.step === 2 && (
        <Step2VoiceSettings
          memberLimit={state.memberLimit}
          bitrate={state.bitrate}
          region={state.region}
          bitrates={wizard.DEFAULT_BITRATES}
          regions={wizard.DEFAULT_REGIONS}
          onUpdate={updateField}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {state.step === 3 && (
        <Step3GuildPrompt
          guildId={state.guildId}
          channelName={state.channelName}
          gameName={state.gameName}
          onSelectGuild={(id, name) => {
            updateField('guildId', id)
            updateField('guildName', name)
          }}
          onBack={prevStep}
          onGoToDetails={() => updateField('step', 1)}
          onSubmit={submitChannel}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  )
}
