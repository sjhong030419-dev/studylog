interface HomeProgressHeaderProps {
  level: number
  progressRatio: number
  streakCount: number
}

export function HomeProgressHeader({ level, progressRatio, streakCount }: HomeProgressHeaderProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progressRatio)) * 100)

  return (
    <section
      className="relative w-full overflow-hidden rounded-[24px] border border-white/80 bg-(--color-home-card) px-4 py-3 shadow-[0_10px_30px_rgba(108,82,130,0.10)]"
      aria-label="캐릭터 성장 현황"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, var(--color-home-soft-pink), transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3">
      <div
        className="flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-[18px] border border-white/70 shadow-inner"
        style={{ background: 'linear-gradient(145deg, var(--color-home-soft-lavender), var(--color-home-soft-pink))' }}
      >
        <span className="font-cute text-[9px] uppercase tracking-wider text-ink-soft">level</span>
        <span className="font-pixel text-[11px] text-ink">{level}</span>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-cute text-sm text-ink">나의 성장</span>
          <span className="font-cute text-xs text-ink-soft" aria-hidden="true">
            {percent}%
          </span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full border border-ink/5 p-[2px]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="현재 레벨 진행률"
          style={{ backgroundColor: 'rgba(74,68,88,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{
              width: `${percent}%`,
              background: 'linear-gradient(90deg, var(--color-home-accent-lavender), var(--color-home-accent-primary))',
            }}
          />
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1 rounded-full border border-white/70 px-2.5 py-1.5 shadow-sm"
        style={{ backgroundColor: 'var(--color-home-soft-peach)' }}
      >
        <span aria-hidden="true">🔥</span>
        <span className="font-cute text-xs text-ink">{streakCount}일</span>
        <span className="sr-only">연속 공부 {streakCount}일</span>
      </div>
      </div>
    </section>
  )
}
