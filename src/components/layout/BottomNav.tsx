import { useState } from 'react'

export type Tab = 'timer' | 'room' | 'capture' | 'stats' | 'ranking' | 'tutor' | 'shop'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const PRIMARY_TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'timer', label: '타이머', icon: '⏱️' },
  { value: 'room', label: '스터디룸', icon: '🪑' },
  { value: 'capture', label: '캡처', icon: '📸' },
  { value: 'stats', label: '통계', icon: '📊' },
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
            className="absolute bottom-[84px] left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[26px] border border-white/80 bg-white/95 p-3 shadow-[0_18px_50px_rgba(56,42,68,0.2)] dark:bg-[#2d2842]/95"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-cute text-sm text-ink">더 둘러보기</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink" aria-label="더보기 닫기">×</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => choose(tab.value)}
                  className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 ${active === tab.value ? 'bg-(--color-home-soft-lavender)' : 'bg-ink/5'}`}
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center border-t border-white/80 bg-white/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(83,63,96,0.08)] backdrop-blur-xl dark:bg-[#2d2842]/92" aria-label="주요 메뉴">
      <div className="grid w-full max-w-sm grid-cols-5 px-2 pt-1.5">
        {PRIMARY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => choose(tab.value)}
            className={`relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 font-cute text-[10px] transition-colors ${
              active === tab.value ? 'text-ink' : 'text-ink-soft'
            }`}
          >
            {active === tab.value && <span className="absolute inset-x-2 top-0 h-1 rounded-full bg-(--color-home-accent-primary)" aria-hidden="true" />}
            <span className={`text-lg ${tab.value === 'capture' ? 'grid h-9 w-9 -translate-y-2 place-items-center rounded-full bg-(--color-home-accent-primary) text-white shadow-lg' : ''}`}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          className={`relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl py-1 font-cute text-[10px] ${moreActive || moreOpen ? 'text-ink' : 'text-ink-soft'}`}
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
