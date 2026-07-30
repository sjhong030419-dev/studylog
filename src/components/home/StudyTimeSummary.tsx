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
    <div className="w-full bg-(--color-home-card) rounded-[22px] shadow-sm px-5 py-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-cute text-ink-soft text-sm">
          {isRunning ? '지금 공부 중인 시간' : '오늘의 공부 시간'}
        </span>
        <span className="font-cute text-ink-soft text-xs">오늘 누적 {formatDuration(todayTotalSec)}</span>
      </div>

      <div
        className="text-center text-ink"
        style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: 'clamp(2.5rem, 12vw, 4rem)',
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
  )
}
