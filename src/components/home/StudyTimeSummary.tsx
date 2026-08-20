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
}: StudyTimeSummaryProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-[24px] border border-white/80 bg-(--color-home-card) px-5 py-5 shadow-[0_12px_30px_rgba(108,82,130,0.10)]">
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-16 opacity-50"
        style={{ background: 'radial-gradient(ellipse at top, var(--color-home-soft-yellow), transparent 72%)' }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-cute text-ink text-sm">
          {isRunning ? '✏️ 지금의 집중 기록' : '✨ 오늘의 모험 기록'}
        </span>
        <span className="font-cute text-ink-soft text-xs">오늘 누적 {formatDuration(todayTotalSec)}</span>
      </div>

      <div
        className="text-center text-ink"
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(2.65rem, 13vw, 4.25rem)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.05em',
        }}
      >
        {formatDuration(elapsedSec)}
      </div>

      <GoalProgress goal={goal} />
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
