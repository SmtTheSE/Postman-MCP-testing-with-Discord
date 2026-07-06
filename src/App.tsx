import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AlertProvider } from './context/AlertContext'
import { CreateChannelPage } from './pages/CreateChannelPage'
import { ServerManagePage } from './pages/ServerManagePage'
import { JukeboxPage } from './pages/JukeboxPage'
import { AppHeader } from './components/AppHeader'
import { RecentStrip } from './components/RecentStrip'
import { QuickDropCard } from './components/QuickDropCard'
import { AlertToastStack } from './components/ui/AlertToastStack'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import type { RecentChannel } from './context/AppContext'

function AppShell() {
  const { loadRecentToWizard, recreateFromRecent, recentChannels, isSubmitting } = useApp()
  const location = useLocation()
  const isCreate = location.pathname === '/'

  const handleRecreate = (channel: RecentChannel) => {
    recreateFromRecent(channel)
  }

  return (
    <div className="liquid-app flex justify-center">
      <div className="liquid-ambient" aria-hidden />
      <div className="ios-shell w-full max-w-[430px] min-h-dvh flex flex-col">
        <AppHeader />
        {isCreate && (
          <>
            <QuickDropCard />
            <RecentStrip
              channels={recentChannels}
              onSelect={loadRecentToWizard}
              onRecreate={handleRecreate}
              isSubmitting={isSubmitting}
            />
          </>
        )}
        <main className="page-scroll flex-1 pt-3 pb-2">
          <Routes>
            <Route path="/" element={<CreateChannelPage />} />
            <Route path="/manage" element={<ServerManagePage />} />
            <Route path="/jukebox" element={<JukeboxPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <AppProvider>
          <AppShell />
          <AlertToastStack />
          <ConfirmDialog />
        </AppProvider>
      </AlertProvider>
    </BrowserRouter>
  )
}
