import { useEffect, useState } from 'react'
import { TimerPage } from './components/timer/TimerPage'
import { LogCaptureCard } from './components/capture/LogCaptureCard'
import { StatsHubPage } from './components/stats/StatsHubPage'
import { RankingBoard } from './components/ranking/RankingBoard'
import { AiTutorChat } from './components/tutor/AiTutorChat'
import { AvatarShop } from './components/shop/AvatarShop'
import { MyPage } from './components/profile/MyPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { NotificationBell } from './components/notifications/NotificationBell'
import { NotificationsPage } from './components/notifications/NotificationsPage'
import { BgmPlayer } from './components/audio/BgmPlayer'
import { BottomNav, type Tab } from './components/layout/BottomNav'
import { useSettingsStore } from './store/settingsStore'
import type { NavTarget } from './types'

type Overlay = 'profile' | 'settings' | 'notifications' | null

function App() {
  const [tab, setTab] = useState<Tab>('timer')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function handleNavigate(target: NavTarget) {
    if (target === 'profile') {
      setOverlay('profile')
    } else {
      setOverlay(null)
      setTab(target)
    }
  }

  return (
    <div className="pb-16">
      {tab === 'timer' && <TimerPage />}
      {tab === 'capture' && <LogCaptureCard />}
      {tab === 'stats' && <StatsHubPage />}
      {tab === 'ranking' && <RankingBoard />}
      {tab === 'tutor' && <AiTutorChat />}
      {tab === 'shop' && <AvatarShop />}

      {overlay && (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-gradient-to-b from-[#fdf6ff] to-[#eef4ff] dark:from-[#1c1830] dark:to-[#14121f]">
          {overlay === 'profile' && <MyPage onOpenSettings={() => setOverlay('settings')} />}
          {overlay === 'settings' && <SettingsPage onBack={() => setOverlay('profile')} />}
          {overlay === 'notifications' && (
            <NotificationsPage onBack={() => setOverlay(null)} onNavigate={handleNavigate} />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOverlay(overlay ? null : 'profile')}
        className="fixed top-3 right-14 z-30 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-lg"
      >
        👤
      </button>
      <NotificationBell onClick={() => setOverlay('notifications')} />

      <BgmPlayer />
      <BottomNav active={tab} onChange={(next) => { setOverlay(null); setTab(next) }} />
    </div>
  )
}

export default App
