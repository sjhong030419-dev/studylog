import { useState } from 'react'
import { StudyTimer } from './StudyTimer'
import { PomodoroTimer } from './PomodoroTimer'
import { HomeProgressHeader } from '../home/HomeProgressHeader'
import { GrowthSummaryGrid } from '../home/GrowthSummaryGrid'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { myOverallRank } from '../../utils/ranking'
import { DailyQuestCard } from '../home/DailyQuestCard'

type Mode = 'normal' | 'pomodoro'

interface TimerPageProps {
  onOpenShop: () => void
  onOpenCapture: () => void
}

export function TimerPage({ onOpenShop, onOpenCapture }: TimerPageProps) {
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
    <main className="min-h-screen px-4 pb-10 pt-4">
      <div className="mx-auto flex w-full flex-col items-center gap-3.5" style={{ maxWidth: 430 }}>
        <HomeProgressHeader level={level.level} progressRatio={level.progressRatio} streakCount={streakCount} />

        <div className="flex w-full items-center justify-between gap-3 px-0.5 max-[350px]:flex-col max-[350px]:items-stretch">
          <div>
            <p className="font-cute text-[11px] tracking-wide text-ink-soft">CHARACTER STUDY RPG</p>
            <h1 className="font-cute text-2xl text-ink">스터디로그 <span aria-hidden="true">📖</span></h1>
          </div>
          <div className="flex gap-2 max-[350px]:grid max-[350px]:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('normal')}
              className={`font-cute min-h-[44px] rounded-full border px-3 py-1.5 text-sm shadow-sm transition-transform active:scale-95 ${
                mode === 'normal' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              일반 타이머
            </button>
            <button
              type="button"
              onClick={() => setMode('pomodoro')}
              className={`font-cute min-h-[44px] rounded-full border px-3 py-1.5 text-sm shadow-sm transition-transform active:scale-95 ${
                mode === 'pomodoro' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              🍅 뽀모도로
            </button>
          </div>
        </div>

        {mode === 'normal' ? <StudyTimer onOpenShop={onOpenShop} onOpenCapture={onOpenCapture} /> : <PomodoroTimer />}

        <DailyQuestCard />

        <GrowthSummaryGrid
          streakCount={streakCount}
          totalStudySec={totalStudySec}
          rank={rank}
          rankTotal={total}
          points={points}
        />
      </div>
    </main>
  )
}
