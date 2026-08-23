import { useState } from 'react'

export type Tab = 'timer' | 'room' | 'capture' | 'stats' | 'ranking' | 'tutor' | 'shop'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const PRIMARY_TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'room', label: '공부방', icon: '🏡' },
  { value: 'stats', label: '기록', icon: '📜' },
  { value: 'timer', label: '집중', icon: '⚔️' },
  { value: 'capture', label: '공유', icon: '📸' },
]

const MORE_TABS: { value: Tab; label: string; icon: string; description: string }[] = [
  { value: 'ranking', label: '랭킹', icon: '🏆', description: '친구들과 성장 비교' },
  { value: 'tutor', label: 'AI튜터', icon: '🤖', description: '공부 질문과 도움' },
  { value: 'shop', label: '상점', icon: '🛍️', description: '캐릭터 꾸미기' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = MORE_TABS.some((tab) => tab.value === active)

  function choose(tab: Tab) {
    setMoreOpen(false)
    onChange(tab)
  }

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-30 bg-ink/10 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-[98px] left-1/2 w-[calc(100%-2rem)] max-w-[410px] -translate-x-1/2 rounded-[28px] border-[3px] border-white/90 bg-white/95 p-3 shadow-[0_8px_0_rgba(56,42,68,0.12),0_22px_50px_rgba(56,42,68,0.24)] dark:bg-[#2d2842]/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-cute text-sm text-ink">모험 메뉴</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink" aria-label="더보기 닫기">×</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => choose(tab.value)}
                  className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-[20px] border-2 px-2 py-3 shadow-[0_3px_0_rgba(78,57,89,0.08)] transition-transform active:translate-y-0.5 active:shadow-none ${active === tab.value ? 'border-white bg-(--color-home-soft-lavender)' : 'border-white/70 bg-ink/5'}`}
                >
                  <span className="text-2xl" aria-hidden="true">{tab.icon}</span>
                  <span className="font-cute text-xs text-ink">{tab.label}</span>
                  <span className="font-cute text-[9px] leading-tight text-ink-soft">{tab.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-1.5 pb-[max(8px,env(safe-area-inset-bottom))]" aria-label="주요 메뉴">
      <div className="pointer-events-auto grid w-full max-w-[440px] grid-cols-5 items-end rounded-[26px] border-[3px] border-white/90 bg-white/90 px-2 pb-1 pt-1.5 shadow-[0_7px_0_rgba(71,52,82,0.11),0_-8px_34px_rgba(83,63,96,0.12)] backdrop-blur-xl dark:bg-[#2d2842]/92">
        {PRIMARY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => choose(tab.value)}
            className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 font-cute text-[10px] transition-all ${
              active === tab.value ? 'text-ink' : 'text-ink-soft'
            }`}
          >
            {active === tab.value && tab.value !== 'timer' && <span className="absolute inset-x-3 top-0 h-1 rounded-full bg-(--color-home-accent-primary)" aria-hidden="true" />}
            <span aria-hidden="true" className={`text-lg ${tab.value === 'timer' ? 'grid h-14 w-14 -translate-y-3 place-items-center rounded-[20px] border-[3px] border-white bg-[linear-gradient(145deg,#f6b058,#ef789f)] text-2xl text-white shadow-[0_6px_0_rgba(117,62,83,0.25),0_10px_22px_rgba(117,62,83,0.22)]' : active === tab.value ? 'scale-110' : ''}`}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          className={`relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 font-cute text-[10px] ${moreActive || moreOpen ? 'text-ink' : 'text-ink-soft'}`}
        >
          {(moreActive || moreOpen) && <span className="absolute inset-x-2 top-0 h-1 rounded-full bg-(--color-home-accent-primary)" aria-hidden="true" />}
          <span className="text-lg" aria-hidden="true">•••</span>
          더보기
        </button>
      </div>
      </nav>
    </>
  )
}
