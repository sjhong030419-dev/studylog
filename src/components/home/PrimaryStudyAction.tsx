interface PrimaryStudyActionProps {
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  /** When set, the start button is disabled and this reason is shown
   * instead of silently doing nothing (e.g. "과목을 먼저 추가해주세요"). */
  disabledReason?: string
}

/** Preserves the exact existing start/pause/resume/stop handlers and states. */
export function PrimaryStudyAction({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabledReason,
}: PrimaryStudyActionProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-3 justify-center">
        {!isRunning && (
          <button
            type="button"
            onClick={onStart}
            disabled={Boolean(disabledReason)}
            className="font-cute px-8 py-3 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            시작
          </button>
        )}
        {isRunning && !isPaused && (
          <button
            type="button"
            onClick={onPause}
            className="font-cute px-8 py-3 rounded-full bg-pastel-lavender text-ink shadow-md text-lg min-h-[44px]"
          >
            일시정지
          </button>
        )}
        {isRunning && isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="font-cute px-8 py-3 rounded-full bg-pastel-mint text-ink shadow-md text-lg min-h-[44px]"
          >
            재개
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            onClick={onStop}
            className="font-cute px-8 py-3 rounded-full bg-white border border-ink/20 text-ink shadow-md text-lg min-h-[44px]"
          >
            종료
          </button>
        )}
      </div>
      {!isRunning && disabledReason && (
        <p className="font-cute text-xs text-ink-soft text-center">{disabledReason}</p>
      )}
    </div>
  )
}
