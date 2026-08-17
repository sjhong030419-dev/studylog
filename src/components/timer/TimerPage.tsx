import { useState } from 'react'
import { StudyTimer } from './StudyTimer'
import { PomodoroTimer } from './PomodoroTimer'
import { HomeProgressHeader } from '../home/HomeProgressHeader'
import { GrowthSummaryGrid } from '../home/GrowthSummaryGrid'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { myOverallRank } from '../../utils/ranking'

type Mode = 'normal' | 'pomodoro'

interface TimerPageProps {
  onOpenShop: () => void
}

export function TimerPage({ onOpenShop }: TimerPageProps) {
  const [mode, setMode] = useState<Mode>('normal')

  const sessions = useTimerStore((s) => s.sessions)
  const streakCount = usePointsStore((s) => s.streakCount)
  const points = usePointsStore((s) => s.balance())
  const studyXpTotal = usePointsStore((s) => s.studyXpTotal())

  const totalStudySec = sessions.reduce((sum, s) => sum + s.durationSec, 0)
  const level = deriveExpLevel(studyXpTotal)
  const myTodaySec = todaySessions(sessions).reduce((sum, s) => sum + s.durationSec, 0)
  const { rank, total } = myOverallRank(myTodaySec)

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 pt-4 pb-8">
      <div className="w-full flex flex-col items-center gap-4" style={{ maxWidth: 430 }}>
        <HomeProgressHeader level={level.level} progressRatio={level.progressRatio} streakCount={streakCount} />

        <div className="w-full flex items-center justify-between">
          <h1 className="font-cute text-2xl text-ink">스터디로그 📖</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('normal')}
              className={`font-cute px-4 py-1.5 rounded-full border text-sm min-h-[36px] ${
                mode === 'normal' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              일반 타이머
            </button>
            <button
              type="button"
              onClick={() => setMode('pomodoro')}
              className={`font-cute px-4 py-1.5 rounded-full border text-sm min-h-[36px] ${
                mode === 'pomodoro' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              🍅 뽀모도로
            </button>
          </div>
        </div>

        {mode === 'normal' ? <StudyTimer onOpenShop={onOpenShop} /> : <PomodoroTimer />}

        <GrowthSummaryGrid
          streakCount={streakCount}
          totalStudySec={totalStudySec}
          rank={rank}
          rankTotal={total}
          points={points}
        />
      </div>
    </div>
  )
}
