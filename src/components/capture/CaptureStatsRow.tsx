import { formatDuration } from '../../utils/time'

interface CaptureStatsRowProps {
  streakCount: number
  totalStudySec: number
  rank: number
  rankTotal: number
  /** null when there's no away-detection data yet today — never fabricated. */
  focusPercent: number | null
  compact?: boolean
}

export function CaptureStatsRow({
  streakCount,
  totalStudySec,
  rank,
  rankTotal,
  focusPercent,
  compact = false,
}: CaptureStatsRowProps) {
  const cards = [
    { icon: '🔥', label: '연속 공부', value: `${streakCount}일`, tint: 'rgba(255,217,138,0.55)' },
    { icon: '⏱️', label: '누적 공부시간', value: formatDuration(totalStudySec), tint: 'rgba(190,231,198,0.55)' },
    { icon: '⭐', label: '랭킹', value: `${rank}/${rankTotal}위`, tint: 'rgba(155,134,217,0.35)' },
    { icon: '🎯', label: '집중도', value: focusPercent == null ? '-' : `${focusPercent}%`, tint: 'rgba(255,182,193,0.5)' },
  ]

  return (
    <div className="w-full grid grid-cols-4 gap-1.5 shrink-0">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl px-1 flex flex-col items-center gap-0.5 shadow-sm ${compact ? 'py-1' : 'py-2'}`}
          style={{ background: c.tint, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.6)' }}
        >
          <span className="text-sm" aria-hidden="true">{c.icon}</span>
          <span className="font-pixel text-ink text-[9px]">{c.value}</span>
          {!compact && <span className="text-ink-soft text-[8px] font-cute text-center leading-tight">{c.label}</span>}
        </div>
      ))}
    </div>
  )
}
