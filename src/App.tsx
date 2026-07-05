import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { CreateChannelPage } from './pages/CreateChannelPage'
import { AppHeader } from './components/AppHeader'
import { RecentStrip } from './components/RecentStrip'
import type { RecentChannel } from './context/AppContext'

function AppShell() {
  const { wizard, recentChannels } = useApp()
  const { updateField } = wizard

  const startFromRecent = (channel: RecentChannel) => {
    updateField('gameName', channel.gameName)
    updateField('channelName', channel.name)
    updateField('guildId', channel.guildId)
    if (channel.guildName) updateField('guildName', channel.guildName)
    updateField('step', 3)
  }

  return (
    <div className="min-h-dvh bg-[#F2F2F7] flex justify-center">
      <div className="ios-shell w-full max-w-[430px] min-h-dvh flex flex-col">
        <AppHeader />
        <RecentStrip channels={recentChannels} onSelect={startFromRecent} />
        <main className="page-scroll flex-1 pt-1">
          <CreateChannelPage />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<AppShell />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
