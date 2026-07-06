import { useApp } from '../context/AppContext'
import { Step1GameDetails } from '../components/Step1GameDetails'
import { Step2VoiceSettings } from '../components/Step2VoiceSettings'
import { Step3GuildPrompt } from '../components/Step3GuildPrompt'
import { JoinLinkShare } from '../components/JoinLinkShare'
import { CustomAlert } from '../components/ui/Alert'
import { saveUserPrefs } from '../lib/userPrefs'

export function CreateChannelPage() {
  const { wizard, result, isSubmitting, error, submitChannel, clearResult, recentChannels, recreateFromRecent } =
    useApp()
  const { state, updateField, nextStep, prevStep } = wizard

  const lastRecent = recentChannels[0]

  const handleRecreateSimilar = () => {
    if (lastRecent) recreateFromRecent(lastRecent)
  }

  if (result) {
    return (
      <JoinLinkShare
        inviteUrl={result.inviteUrl}
        channelName={state.channelName || result.channel.name}
        gameName={state.gameName}
        onCreateAnother={clearResult}
        onRecreateSimilar={lastRecent ? handleRecreateSimilar : undefined}
        isSubmitting={isSubmitting}
      />
    )
  }

  return (
    <>
      {error && (
        <div className="mb-6">
          <CustomAlert variant="error" title="Couldn't create channel" message={error} operation="create" />
        </div>
      )}

      {state.step === 1 && (
        <Step1GameDetails
          gameName={state.gameName}
          channelName={state.channelName}
          description={state.description}
          createCategory={state.createCategory}
          createTextChannel={state.createTextChannel}
          onUpdate={updateField}
          onNext={nextStep}
          onSkipToServer={() => updateField('step', 3)}
        />
      )}
      {state.step === 2 && (
        <Step2VoiceSettings
          memberLimit={state.memberLimit}
          bitrate={state.bitrate}
          region={state.region}
          maxAge={state.maxAge}
          maxUses={state.maxUses}
          bitrates={wizard.DEFAULT_BITRATES}
          regions={wizard.DEFAULT_REGIONS}
          maxAges={wizard.DEFAULT_MAX_AGES}
          maxUsesList={wizard.DEFAULT_MAX_USES}
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
            saveUserPrefs({ guildId: id, guildName: name })
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
