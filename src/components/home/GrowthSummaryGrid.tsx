import { formatDuration } from '../../utils/time'

interface GrowthSummaryGridProps {
  streakCount: number
  totalStudySec: number
  rank: number
  rankTotal: number
  points: number
}

/**
 * Four real-data growth cards. "Achievements" has no backing feature in
 * this project yet, so per PRD §13.2 it is substituted with an existing
 * metric (points balance) rather than fabricated.
 */
export function GrowthSummaryGrid({ streakCount, totalStudySec, rank, rankTotal, points }: GrowthSummaryGridProps) {
  const cards: { icon: string; label: string; value: string; bg: string }[] = [
    { icon: '🔥', label: '연속 공부', value: `${streakCount}일`, bg: 'var(--color-home-soft-peach)' },
    { icon: '⏱️', label: '누적 공부시간', value: formatDuration(totalStudySec), bg: 'var(--color-home-soft-yellow)' },
    { icon: '⭐', label: '전체 랭킹', value: `${rank}/${rankTotal}위`, bg: 'var(--color-home-soft-lavender)' },
    { icon: '💰', label: '보유 포인트', value: `${points}P`, bg: 'var(--color-home-soft-pink)' },
  ]

  return (
    <div className="w-full grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-[22px] px-4 py-3 flex flex-col gap-1 shadow-sm"
          style={{ backgroundColor: c.bg }}
        >
          <span className="text-lg" aria-hidden="true">
            {c.icon}
          </span>
          <span className="font-cute text-ink-soft text-xs">{c.label}</span>
          <span className="font-pixel text-ink text-base">{c.value}</span>
        </div>
      ))}
    </div>
  )
}
