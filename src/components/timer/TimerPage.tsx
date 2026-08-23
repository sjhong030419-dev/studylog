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
    <main className="min-h-screen overflow-hidden px-3 pb-12 pt-3 sm:px-4">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[640px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,238,192,0.72)_0%,rgba(244,218,235,0.42)_42%,transparent_72%)]" />
        <div className="absolute -left-24 top-44 h-72 w-72 rounded-full bg-pastel-lavender/25 blur-3xl" />
        <div className="absolute -right-24 top-80 h-72 w-72 rounded-full bg-pastel-pink/25 blur-3xl" />
      </div>
      <div className="mx-auto flex w-full flex-col items-center gap-3" style={{ maxWidth: 430 }}>
        <HomeProgressHeader level={level.level} progressRatio={level.progressRatio} streakCount={streakCount} />

        <div className="flex w-full items-center justify-between gap-3 px-1">
          <div>
            <p className="font-cute text-[9px] tracking-[0.18em] text-ink-soft">MY STUDY ADVENTURE</p>
            <h1 className="font-cute text-[22px] leading-tight text-ink">StudyLog <span aria-hidden="true">✦</span></h1>
          </div>
          <div className="flex rounded-2xl border border-white/90 bg-white/65 p-1 shadow-[0_8px_20px_rgba(77,55,90,0.09)] backdrop-blur">
            <button
              type="button"
              onClick={() => setMode('normal')}
              className={`font-cute min-h-[38px] rounded-xl px-3 py-1 text-xs transition-all active:scale-95 ${
                mode === 'normal' ? 'bg-ink text-white shadow-md' : 'text-ink-soft'
              }`}
            >
              ⏱ 집중
            </button>
            <button
              type="button"
              onClick={() => setMode('pomodoro')}
              className={`font-cute min-h-[38px] rounded-xl px-3 py-1 text-xs transition-all active:scale-95 ${
                mode === 'pomodoro' ? 'bg-ink text-white shadow-md' : 'text-ink-soft'
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
