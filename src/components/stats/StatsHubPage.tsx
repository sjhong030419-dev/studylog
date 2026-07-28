import { useState } from 'react'
import { StudyPlanner } from '../planner/StudyPlanner'
import { StatsPage } from './StatsPage'

type Tab = 'planner' | 'stats'

export function StatsHubPage() {
  const [tab, setTab] = useState<Tab>('planner')

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">플래너 & 통계 📊</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('planner')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            tab === 'planner' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          플래너
        </button>
        <button
          type="button"
          onClick={() => setTab('stats')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            tab === 'stats' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          통계
        </button>
      </div>

      {tab === 'planner' ? <StudyPlanner /> : <StatsPage />}
    </div>
  )
}
