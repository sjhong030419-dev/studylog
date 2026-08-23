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
    <section className="w-full grid grid-cols-2 gap-2.5 rounded-[28px] border border-white/80 bg-white/35 p-2.5 shadow-[0_12px_30px_rgba(108,82,130,0.08)] backdrop-blur" aria-label="오늘의 성장 요약">
      {cards.map((c) => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-[20px] border-2 border-white/80 px-3 py-3 shadow-[0_4px_0_rgba(84,62,94,0.08)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none"
          style={{ backgroundColor: c.bg }}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/65 text-base shadow-sm" aria-hidden="true">
              {c.icon}
            </span>
            <span className="font-cute text-ink-soft text-xs">{c.label}</span>
          </div>
          <span className="mt-1 font-pixel text-ink text-base">{c.value}</span>
        </div>
      ))}
    </section>
  )
}
