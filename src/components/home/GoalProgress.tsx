import type { DailyGoalState } from '../../utils/dailyGoal'
import { formatDuration } from '../../utils/time'

export function GoalProgress({ goal }: { goal: DailyGoalState }) {
  if (!goal.configured) {
    return (
      <p className="text-ink-soft text-xs font-cute text-center py-1">
        오늘 등록된 목표 시간이 없어요. 플래너 탭에서 추가해보세요!
      </p>
    )
  }

  const barPercent = Math.min(100, Math.max(0, goal.percent))
  const label = goal.reached
    ? goal.percent > 100
      ? `목표 초과 달성! ${goal.percent}%`
      : '오늘 목표 달성! 🎉'
    : `${goal.percent}%`

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-cute text-xs text-ink-soft">
          목표 진행률 · {formatDuration(goal.achievedSec)} / {formatDuration(goal.targetSec)}
        </span>
        <span className="font-cute text-xs text-ink">{label}</span>
      </div>
      <div
        className="h-3 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={barPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="오늘 목표 진행률"
        style={{ backgroundColor: 'rgba(74,68,88,0.1)' }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{
            width: `${barPercent}%`,
            backgroundColor: goal.reached ? 'var(--color-home-success)' : 'var(--color-home-accent-peach)',
          }}
        />
      </div>
    </div>
  )
}
