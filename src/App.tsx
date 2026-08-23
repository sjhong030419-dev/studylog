import { lazy, Suspense, useEffect, useState } from 'react'
import { TimerPage } from './components/timer/TimerPage'
import { NotificationBell } from './components/notifications/NotificationBell'
import { RewardToastHost } from './components/feedback/RewardToastHost'
import { BgmPlayer } from './components/audio/BgmPlayer'
import { BottomNav, type Tab } from './components/layout/BottomNav'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { useSettingsStore } from './store/settingsStore'
import { useProfileStore } from './store/profileStore'
import type { NavTarget } from './types'

type Overlay = 'profile' | 'settings' | 'notifications' | 'subjects' | null

// Timer is the first screen and stays eager. Every secondary surface is
// loaded only when the user opens it, so the large capture library, shop,
// ranking and settings code no longer delay the emotional first screen.
const RoomPage = lazy(() => import('./components/room/RoomPage').then((module) => ({ default: module.RoomPage })))
const RoomConnection = lazy(() => import('./components/room/RoomConnection').then((module) => ({ default: module.RoomConnection })))
const LogCaptureCard = lazy(() => import('./components/capture/LogCaptureCard').then((module) => ({ default: module.LogCaptureCard })))
const StatsHubPage = lazy(() => import('./components/stats/StatsHubPage').then((module) => ({ default: module.StatsHubPage })))
const RankingBoard = lazy(() => import('./components/ranking/RankingBoard').then((module) => ({ default: module.RankingBoard })))
const AiTutorChat = lazy(() => import('./components/tutor/AiTutorChat').then((module) => ({ default: module.AiTutorChat })))
const AvatarShop = lazy(() => import('./components/shop/AvatarShop').then((module) => ({ default: module.AvatarShop })))
const MyPage = lazy(() => import('./components/profile/MyPage').then((module) => ({ default: module.MyPage })))
const SettingsPage = lazy(() => import('./components/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const SubjectManagerPage = lazy(() => import('./components/subjects/SubjectManagerPage').then((module) => ({ default: module.SubjectManagerPage })))
const NotificationsPage = lazy(() => import('./components/notifications/NotificationsPage').then((module) => ({ default: module.NotificationsPage })))

function ScreenLoading() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/80 bg-white/75 px-8 py-6 shadow-sm backdrop-blur">
        <span className="animate-avatar-bob text-3xl" aria-hidden="true">📖</span>
        <span className="font-cute text-sm text-ink-soft">공부방을 준비하고 있어요...</span>
      </div>
    </div>
  )
}

/** Realtime presence is useful across tabs, but it must not compete with
 * the character room for the first paint. The same persistent connection
 * still mounts once for the app lifetime, just after the home becomes
 * interactive. */
function DeferredRoomConnection() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setReady(true), 1200)
    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!ready) return null
  return (
    <Suspense fallback={null}>
      <RoomConnection />
    </Suspense>
  )
}

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
    <div className={`app-shell min-h-svh pt-[72px] ${tab === 'timer' && !overlay ? 'pb-0' : 'pb-28'}`}>
      <Suspense fallback={<ScreenLoading />}>
      {tab === 'timer' && <TimerPage onOpenShop={() => setTab('shop')} onOpenCapture={() => setTab('capture')} />}
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
      </Suspense>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-3 pt-[max(10px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex w-full max-w-[430px] items-center justify-between rounded-[22px] border-2 border-white/90 bg-white/72 px-2.5 py-2 shadow-[0_6px_0_rgba(79,58,89,0.08),0_14px_30px_rgba(73,53,84,0.12)] backdrop-blur-xl dark:bg-[#2d2842]/82">
          <div className="flex items-center gap-2 px-1">
            <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-[linear-gradient(145deg,var(--color-home-soft-yellow),var(--color-home-soft-pink))] text-lg shadow-inner" aria-hidden="true">📖</span>
            <div className="leading-none">
              <span className="block font-pixel text-[8px] tracking-[0.1em] text-ink">STUDYLOG</span>
              <span className="mt-1 block font-cute text-[9px] text-ink-soft">나의 공부 모험</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOverlay(overlay ? null : 'profile')}
              className="grid h-10 w-10 place-items-center rounded-[15px] border border-white bg-(--color-home-soft-lavender) text-base shadow-[0_3px_0_rgba(74,53,84,0.11)] transition-transform active:translate-y-0.5 active:shadow-none"
              aria-label={overlay ? '프로필 화면 닫기' : '내 프로필 열기'}
            >
              👤
            </button>
            <NotificationBell onClick={() => setOverlay('notifications')} />
          </div>
        </div>
      </div>
      <RewardToastHost />

      <DeferredRoomConnection />
      <BgmPlayer />
      <BottomNav active={tab} onChange={(next) => { setOverlay(null); setTab(next) }} />
    </div>
  )
}

export default App
