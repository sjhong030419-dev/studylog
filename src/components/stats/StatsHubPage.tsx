import { useState } from 'react'
import { StudyPlanner } from '../planner/StudyPlanner'
import { StatsPage } from './StatsPage'

type Tab = 'planner' | 'stats'

export function StatsHubPage() {
  const [tab, setTab] = useState<Tab>('planner')

  return (
    <main className="min-h-screen px-4 pb-32 pt-6">
      <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-5">
      <div className="w-full text-left">
        <p className="font-cute text-[11px] tracking-wide text-ink-soft">PLAN YOUR ADVENTURE</p>
        <h1 className="font-cute text-3xl text-ink">플래너 & 통계 📊</h1>
        <p className="mt-1 font-cute text-xs text-ink-soft">숫자는 조용히 정리하고, 오늘의 다음 성장을 준비해요.</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('planner')}
          className={`font-cute min-h-[44px] px-4 py-1.5 rounded-full border text-sm ${
            tab === 'planner' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          플래너
        </button>
        <button
          type="button"
          onClick={() => setTab('stats')}
          className={`font-cute min-h-[44px] px-4 py-1.5 rounded-full border text-sm ${
            tab === 'stats' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          통계
        </button>
      </div>

      {tab === 'planner' ? <StudyPlanner /> : <StatsPage />}
      </div>
    </main>
  )
}
