interface CaptureExpBadgeProps {
  level: number
  progressRatio: number
  /** Level just before the most recently earned study session, from real
   * transaction history (PRD §14 "level before and after"). Omit when
   * there's no session history yet — showing a transition then would be
   * meaningless, not merely unchanged. */
  levelBefore?: number
}

/** Compact pink game-UI-style Lv/EXP bar, overlaid near the character
 * inside the scene — distinct from Home's HomeProgressHeader (lavender,
 * lives in its own card) per this card's own spec (pink, sits in-scene). */
export function CaptureExpBadge({ level, progressRatio, levelBefore }: CaptureExpBadgeProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progressRatio)) * 100)

  return (
    <div className="inline-flex items-center gap-1.5 bg-white/85 rounded-full pl-2 pr-3 py-1 shadow-sm">
      <span className="font-pixel text-[9px] text-ink">
        {levelBefore !== undefined ? `Lv.${levelBefore} → Lv.${level}` : `Lv.${level}`}
      </span>
      <div className="w-14 h-1.5 rounded-full bg-[#ffd6e8] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: '#ff6fa5' }} />
      </div>
    </div>
  )
}
