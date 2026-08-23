import { useState } from 'react'
import { StudyTimer } from './StudyTimer'
import { PomodoroTimer } from './PomodoroTimer'
import { GrowthSummaryGrid } from '../home/GrowthSummaryGrid'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { myOverallRank } from '../../utils/ranking'
import { DailyQuestCard } from '../home/DailyQuestCard'
import { deriveDailyQuests } from '../../quests/dailyQuests'
import { todayKey } from '../../utils/time'

type Mode = 'normal' | 'pomodoro'

interface TimerPageProps {
  onOpenShop: () => void
  onOpenCapture: () => void
}

export function TimerPage({ onOpenShop, onOpenCapture }: TimerPageProps) {
  const [mode, setMode] = useState<Mode>('normal')
  const [detailPanel, setDetailPanel] = useState<'quests' | 'growth' | null>(null)

  const sessions = useTimerStore((s) => s.sessions)
  const streakCount = usePointsStore((s) => s.streakCount)
  const points = usePointsStore((s) => s.balance())
  const studyXpTotal = usePointsStore((s) => s.studyXpTotal())

  const totalStudySec = sessions.reduce((sum, s) => sum + s.durationSec, 0)
  const level = deriveExpLevel(studyXpTotal)
  const myTodaySec = todaySessions(sessions).reduce((sum, s) => sum + s.durationSec, 0)
  const { rank, total } = myOverallRank(myTodaySec)
  const quests = deriveDailyQuests(sessions, todayKey())
  const completedQuests = quests.filter((quest) => quest.complete).length

  return (
    <main className="h-[calc(100svh-166px)] min-h-0 overflow-hidden px-3 py-2">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[640px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,238,192,0.72)_0%,rgba(244,218,235,0.42)_42%,transparent_72%)]" />
        <div className="absolute -left-24 top-44 h-72 w-72 rounded-full bg-pastel-lavender/25 blur-3xl" />
        <div className="absolute -right-24 top-80 h-72 w-72 rounded-full bg-pastel-pink/25 blur-3xl" />
      </div>
      <div className="mx-auto grid h-full w-full max-w-[430px] min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
        <div className="flex min-w-0 w-full items-center justify-between gap-2">
          <div className="flex rounded-[16px] border border-white/90 bg-white/65 p-1 shadow-[0_8px_20px_rgba(77,55,90,0.09)] backdrop-blur">
            <button
              type="button"
              onClick={() => setDetailPanel('growth')}
              className="min-h-[36px] min-w-[66px] rounded-[12px] px-2 font-cute text-[9px] text-ink transition-colors hover:bg-white/55 active:bg-white/80"
            >
              ⭐ LV.{level.level}
            </button>
            <button
              type="button"
              onClick={() => setDetailPanel('quests')}
              className="min-h-[36px] min-w-[66px] rounded-[12px] px-2 font-cute text-[9px] text-ink transition-colors hover:bg-white/55 active:bg-white/80"
            >
              📜 {completedQuests}/{quests.length}
            </button>
          </div>
          <div className="flex rounded-[16px] border border-white/90 bg-white/65 p-1 shadow-[0_8px_20px_rgba(77,55,90,0.09)] backdrop-blur">
            <button
              type="button"
              onClick={() => setMode('normal')}
              className={`min-h-[36px] min-w-[66px] rounded-[12px] px-2 py-1 font-cute text-[10px] transition-all active:scale-95 ${
                mode === 'normal' ? 'bg-ink text-white shadow-md' : 'text-ink-soft'
              }`}
            >
              ⏱ 집중
            </button>
            <button
              type="button"
              onClick={() => setMode('pomodoro')}
              className={`min-h-[36px] min-w-[66px] rounded-[12px] px-2 py-1 font-cute text-[10px] transition-all active:scale-95 ${
                mode === 'pomodoro' ? 'bg-ink text-white shadow-md' : 'text-ink-soft'
              }`}
            >
              🍅 뽀모도로
            </button>
          </div>
        </div>

        <div className="min-h-0 min-w-0">
          {mode === 'normal' ? (
            <StudyTimer
              onOpenShop={onOpenShop}
              onOpenCapture={onOpenCapture}
              onOpenQuests={() => setDetailPanel('quests')}
              compactHome
            />
          ) : (
            <div className="h-full overflow-y-auto overscroll-contain rounded-[26px] pr-1"><PomodoroTimer /></div>
          )}
        </div>

      </div>

      {detailPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 px-3 pb-[max(92px,env(safe-area-inset-bottom))] pt-16 backdrop-blur-sm" onClick={() => setDetailPanel(null)}>
          <section className="max-h-[72svh] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-[30px] border-[3px] border-white/90 bg-[#fffaf3] p-3 shadow-[0_8px_0_rgba(55,39,67,0.16),0_24px_60px_rgba(55,39,67,0.28)]" onClick={(event) => event.stopPropagation()} aria-label={detailPanel === 'quests' ? '오늘의 퀘스트 상세' : '성장 기록 상세'}>
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <div>
                <p className="font-cute text-[9px] tracking-[0.14em] text-ink-soft">ADVENTURE PANEL</p>
                <h2 className="font-cute text-lg text-ink">{detailPanel === 'quests' ? '오늘의 퀘스트' : '나의 성장 기록'}</h2>
              </div>
              <button type="button" onClick={() => setDetailPanel(null)} className="grid h-10 w-10 place-items-center rounded-2xl bg-ink/5 font-cute text-ink" aria-label="상세 패널 닫기">×</button>
            </div>
            {detailPanel === 'quests' ? (
              <DailyQuestCard />
            ) : (
              <GrowthSummaryGrid streakCount={streakCount} totalStudySec={totalStudySec} rank={rank} rankTotal={total} points={points} />
            )}
          </section>
        </div>
      )}
    </main>
  )
}
