with open('src/pages/CreateChannelPage.tsx', 'r') as f:
    content = f.read()

search = """
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
"""

replace = """
      {state.step === 1 && (
        <Step1GameDetails
          gameName={state.gameName}
          channelName={state.channelName}
          description={state.description}
          createCategory={state.createCategory}
          createTextChannel={state.createTextChannel}
          onUpdate={updateField}
          onNext={nextStep}
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
"""

content = content.replace(search.strip(), replace.strip())

with open('src/pages/CreateChannelPage.tsx', 'w') as f:
    f.write(content)


with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

search2 = """
      const res = await discordApi.createVoiceChannel({
        guildId: wizard.state.guildId,
        channelName: wizard.state.channelName,
        gameName: wizard.state.gameName,
        description: wizard.state.description,
        memberLimit: wizard.state.memberLimit,
        bitrate: wizard.state.bitrate,
        region: wizard.state.region,
      })
"""

replace2 = """
      const res = await discordApi.createVoiceChannel({
        guildId: wizard.state.guildId,
        channelName: wizard.state.channelName,
        gameName: wizard.state.gameName,
        description: wizard.state.description,
        memberLimit: wizard.state.memberLimit,
        bitrate: wizard.state.bitrate,
        region: wizard.state.region,
        createCategory: wizard.state.createCategory,
        createTextChannel: wizard.state.createTextChannel,
        maxAge: wizard.state.maxAge,
        maxUses: wizard.state.maxUses,
      })
"""

content = content.replace(search2.strip(), replace2.strip())

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
