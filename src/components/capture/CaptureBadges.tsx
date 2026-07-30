import type { Achievement } from '../../utils/achievements'

interface CaptureBadgesProps {
  achievements: Achievement[]
  compact?: boolean
}

const STICKER_TINTS = [
  'linear-gradient(160deg, #fff1bf 0%, #ffe6d5 100%)',
  'linear-gradient(160deg, #ffe4ec 0%, #ffd6e8 100%)',
  'linear-gradient(160deg, #eee5ff 0%, #d3c2ff 100%)',
  'linear-gradient(160deg, #c9f5e0 0%, #bee7c6 100%)',
  'linear-gradient(160deg, #d3ebff 0%, #a7d7ff 100%)',
]
const STICKER_TILT = [-6, 4, -3, 6, -5]

export function CaptureBadges({ achievements, compact = false }: CaptureBadgesProps) {
  if (achievements.length === 0) return null

  return (
    <div className="w-full flex justify-center gap-2.5 flex-wrap shrink-0">
      {achievements.map((a, i) => (
        <div
          key={a.id}
          className={`rounded-full flex flex-col items-center justify-center gap-0 shadow-md ${
            compact ? 'w-7 h-7' : 'w-11 h-11'
          }`}
          style={{
            background: STICKER_TINTS[i % STICKER_TINTS.length],
            border: '2px solid rgba(255,255,255,0.8)',
            transform: `rotate(${STICKER_TILT[i % STICKER_TILT.length]}deg)`,
          }}
          title={a.label}
        >
          <span className={compact ? 'text-sm leading-none' : 'text-base leading-none'} aria-hidden="true">
            {a.emoji}
          </span>
          {!compact && <span className="text-ink text-[6px] font-cute leading-tight">{a.label}</span>}
        </div>
      ))}
    </div>
  )
}
