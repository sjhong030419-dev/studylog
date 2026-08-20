import { useEffect, useState } from 'react'
import { TimerPage } from './components/timer/TimerPage'
import { RoomPage } from './components/room/RoomPage'
import { RoomConnection } from './components/room/RoomConnection'
import { LogCaptureCard } from './components/capture/LogCaptureCard'
import { StatsHubPage } from './components/stats/StatsHubPage'
import { RankingBoard } from './components/ranking/RankingBoard'
import { AiTutorChat } from './components/tutor/AiTutorChat'
import { AvatarShop } from './components/shop/AvatarShop'
import { MyPage } from './components/profile/MyPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { SubjectManagerPage } from './components/subjects/SubjectManagerPage'
import { NotificationBell } from './components/notifications/NotificationBell'
import { NotificationsPage } from './components/notifications/NotificationsPage'
import { BgmPlayer } from './components/audio/BgmPlayer'
import { BottomNav, type Tab } from './components/layout/BottomNav'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { useSettingsStore } from './store/settingsStore'
import { useProfileStore } from './store/profileStore'
import type { NavTarget } from './types'

type Overlay = 'profile' | 'settings' | 'notifications' | 'subjects' | null

function App() {
  const [tab, setTab] = useState<Tab>('timer')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const theme = useSettingsStore((s) => s.theme)
  const onboardingCompleted = useProfileStore((s) => s.onboardingCompleted)

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

  // Existing users always have onboardingCompleted migrated to true (see
  // profileStore's migrate()), so this only ever gates brand-new installs.
  // RoomConnection/BgmPlayer stay unmounted until it's done so they never
  // join the realtime room with placeholder nickname/gender.
  if (!onboardingCompleted) {
    return <OnboardingFlow />
  }

  return (
    <div className="pb-24">
      {tab === 'timer' && <TimerPage onOpenShop={() => setTab('shop')} />}
      {tab === 'room' && <RoomPage />}
      {tab === 'capture' && <LogCaptureCard />}
      {tab === 'stats' && <StatsHubPage />}
      {tab === 'ranking' && <RankingBoard />}
      {tab === 'tutor' && <AiTutorChat />}
      {tab === 'shop' && <AvatarShop />}

      {overlay && (
        <div className="fixed inset-0 z-30 overflow-y-auto bg-gradient-to-b from-[#fdf6ff] to-[#eef4ff] dark:from-[#1c1830] dark:to-[#14121f]">
          {overlay === 'profile' && <MyPage onOpenSettings={() => setOverlay('settings')} />}
          {overlay === 'settings' && (
            <SettingsPage onBack={() => setOverlay('profile')} onOpenSubjects={() => setOverlay('subjects')} />
          )}
          {overlay === 'subjects' && <SubjectManagerPage onBack={() => setOverlay('settings')} />}
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

      <RoomConnection />
      <BgmPlayer />
      <BottomNav active={tab} onChange={(next) => { setOverlay(null); setTab(next) }} />
    </div>
  )
}

export default App
