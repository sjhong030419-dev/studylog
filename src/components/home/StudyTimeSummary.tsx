import { GoalProgress } from './GoalProgress'
import { PrimaryStudyAction } from './PrimaryStudyAction'
import type { DailyGoalState } from '../../utils/dailyGoal'
import { formatDuration } from '../../utils/time'

interface StudyTimeSummaryProps {
  elapsedSec: number
  todayTotalSec: number
  goal: DailyGoalState
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  disabledReason?: string
  compact?: boolean
}

/**
 * The active-session duration (`elapsedSec`) and the daily total
 * (`todayTotalSec`) are two distinct existing values — this component
 * displays both without conflating their meaning (PRD §12.2).
 */
export function StudyTimeSummary({
  elapsedSec,
  todayTotalSec,
  goal,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabledReason,
  compact = false,
}: StudyTimeSummaryProps) {
  if (compact) {
    return (
      <section className="relative z-10 mt-2 w-full overflow-hidden rounded-t-[22px] border-[3px] border-b-0 border-white bg-(--color-home-card) px-3 pb-1.5 pt-2 shadow-[0_10px_24px_rgba(74,52,83,0.10)]">
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-12 opacity-45"
          style={{ background: 'radial-gradient(ellipse at top, var(--color-home-soft-yellow), transparent 72%)' }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between gap-2">
          <span className="font-cute text-[11px] text-ink">
            {isRunning ? '✏️ 모험 진행 중' : '⚔️ 집중 모험 준비'}
          </span>
          <span className="rounded-full bg-pastel-yellow/70 px-2 py-0.5 font-cute text-[8px] text-ink-soft">
            오늘 {formatDuration(todayTotalSec)}
          </span>
        </div>

        <div className="relative mt-1 grid grid-cols-[minmax(112px,0.9fr)_minmax(0,1.1fr)] items-center gap-2">
          <div
            className="text-center text-ink"
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: 'clamp(1.75rem, 8.5vw, 2.35rem)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.025em',
            }}
          >
            {formatDuration(elapsedSec)}
          </div>
          <PrimaryStudyAction
            isRunning={isRunning}
            isPaused={isPaused}
            onStart={onStart}
            onPause={onPause}
            onResume={onResume}
            onStop={onStop}
            disabledReason={disabledReason}
            compact
          />
        </div>

        <div className="relative mt-1 flex items-center gap-2 px-1">
          <span className="shrink-0 font-cute text-[8px] text-ink-soft">
            {goal.configured ? `목표 ${Math.min(100, goal.percent)}%` : '자유 모험'}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#f0a769,#ed7fa4)] transition-[width] duration-700"
              style={{ width: `${goal.configured ? Math.min(100, goal.percent) : 0}%` }}
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative z-10 mt-3 w-[94%] overflow-hidden rounded-[26px] border-[3px] border-white bg-(--color-home-card) px-4 py-4 shadow-[0_6px_0_rgba(91,68,101,0.11),0_14px_28px_rgba(74,52,83,0.18)]">
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-16 opacity-50"
        style={{ background: 'radial-gradient(ellipse at top, var(--color-home-soft-yellow), transparent 72%)' }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-cute text-ink text-sm">
          {isRunning ? '✏️ 모험 진행 중' : '⚔️ 집중 모험 준비'}
        </span>
        <span className="rounded-full bg-pastel-yellow/70 px-2.5 py-1 font-cute text-[10px] text-ink-soft">누적 {formatDuration(todayTotalSec)}</span>
      </div>

      <div
        className="text-center text-ink"
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(2.8rem, 14vw, 4.5rem)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.05em',
        }}
      >
        {formatDuration(elapsedSec)}
      </div>

      <div className="rounded-2xl border border-ink/5 bg-white/55 px-3 py-2.5 shadow-inner">
        <GoalProgress goal={goal} />
      </div>
      <PrimaryStudyAction
        isRunning={isRunning}
        isPaused={isPaused}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
        disabledReason={disabledReason}
      />
      </div>
    </section>
  )
}
