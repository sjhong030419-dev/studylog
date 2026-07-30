interface HomeProgressHeaderProps {
  level: number
  progressRatio: number
  streakCount: number
}

export function HomeProgressHeader({ level, progressRatio, streakCount }: HomeProgressHeaderProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progressRatio)) * 100)

  return (
    <div className="w-full bg-(--color-home-card) rounded-[22px] shadow-sm px-4 py-3 flex items-center gap-3">
      <div
        className="flex flex-col items-center justify-center rounded-2xl w-12 h-12 shrink-0"
        style={{ backgroundColor: 'var(--color-home-soft-lavender)' }}
      >
        <span className="font-pixel text-[10px] text-ink">Lv.{level}</span>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-cute text-xs text-ink-soft">공부 레벨</span>
          <span className="font-cute text-xs text-ink-soft" aria-hidden="true">
            {percent}%
          </span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="현재 레벨 진행률"
          style={{ backgroundColor: 'rgba(74,68,88,0.1)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${percent}%`, backgroundColor: 'var(--color-home-accent-lavender)' }}
          />
        </div>
      </div>

      <div
        className="flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1.5"
        style={{ backgroundColor: 'var(--color-home-soft-peach)' }}
      >
        <span aria-hidden="true">🔥</span>
        <span className="font-cute text-xs text-ink">{streakCount}일</span>
        <span className="sr-only">연속 공부 {streakCount}일</span>
      </div>
    </div>
  )
}
