interface HomeProgressHeaderProps {
  level: number
  progressRatio: number
  streakCount: number
}

export function HomeProgressHeader({ level, progressRatio, streakCount }: HomeProgressHeaderProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progressRatio)) * 100)

  return (
    <section
      className="relative w-full overflow-hidden rounded-[22px] border-2 border-white/90 bg-(--color-home-card) px-3 py-2.5 shadow-[0_10px_0_rgba(94,70,105,0.08),0_14px_30px_rgba(108,82,130,0.12)]"
      aria-label="캐릭터 성장 현황"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-60"
        style={{ background: 'radial-gradient(circle, var(--color-home-soft-pink), transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2.5">
      <div
        className="flex h-14 w-14 shrink-0 -rotate-2 flex-col items-center justify-center rounded-[18px] border-2 border-white shadow-[0_4px_0_rgba(73,54,83,0.13)]"
        style={{ background: 'linear-gradient(145deg, var(--color-home-soft-lavender), var(--color-home-soft-pink))' }}
      >
        <span className="font-cute text-[8px] uppercase tracking-wider text-ink-soft">level</span>
        <span className="font-pixel text-sm text-ink">{level}</span>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-cute text-[13px] text-ink">다음 레벨까지</span>
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
            className="relative h-full rounded-full transition-[width] duration-700 ease-out after:absolute after:inset-x-1 after:top-[1px] after:h-[2px] after:rounded-full after:bg-white/65 motion-reduce:transition-none"
            style={{
              width: `${percent}%`,
              background: 'linear-gradient(90deg, var(--color-home-accent-lavender), var(--color-home-accent-primary))',
            }}
          />
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1 rounded-[15px] border-2 border-white px-2.5 py-2 shadow-[0_3px_0_rgba(73,54,83,0.10)]"
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
