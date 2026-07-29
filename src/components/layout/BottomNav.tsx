export type Tab = 'timer' | 'room' | 'capture' | 'stats' | 'ranking' | 'tutor' | 'shop'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'timer', label: '타이머', icon: '⏱️' },
  { value: 'room', label: '스터디룸', icon: '🪑' },
  { value: 'capture', label: '캡처', icon: '📸' },
  { value: 'stats', label: '통계', icon: '📊' },
  { value: 'ranking', label: '랭킹', icon: '🏆' },
  { value: 'tutor', label: 'AI튜터', icon: '🤖' },
  { value: 'shop', label: '상점', icon: '🛍️' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-ink/10 flex justify-center z-10">
      <div className="flex w-full max-w-sm overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex-1 min-w-[48px] flex flex-col items-center gap-0.5 py-2 font-cute text-[9px] ${
              active === tab.value ? 'text-ink' : 'text-ink-soft'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
