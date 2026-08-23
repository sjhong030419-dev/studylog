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
      <div className="flex w-full gap-2.5 justify-center">
        {!isRunning && (
          <button
            type="button"
            onClick={onStart}
            disabled={Boolean(disabledReason)}
            className="min-h-[52px] w-full rounded-[18px] border-2 border-white bg-[linear-gradient(135deg,#ffc763,#f58ba8)] px-8 py-3 font-cute text-lg text-white shadow-[0_6px_0_rgba(126,70,87,0.22),0_10px_22px_rgba(126,70,87,0.16)] transition-transform active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            집중 모험 시작 ⚔️
          </button>
        )}
        {isRunning && !isPaused && (
          <button
            type="button"
            onClick={onPause}
            className="min-h-[52px] flex-1 rounded-[18px] border-2 border-white bg-pastel-lavender px-5 py-3 font-cute text-base text-ink shadow-[0_5px_0_rgba(91,69,112,0.16)] transition-transform active:translate-y-0.5 active:shadow-none"
          >
            일시정지
          </button>
        )}
        {isRunning && isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="min-h-[52px] flex-1 rounded-[18px] border-2 border-white bg-pastel-mint px-5 py-3 font-cute text-base text-ink shadow-[0_5px_0_rgba(64,111,91,0.16)] transition-transform active:translate-y-0.5 active:shadow-none"
          >
            재개
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            onClick={onStop}
            className="min-h-[52px] flex-1 rounded-[18px] border-2 border-white bg-pastel-pink px-5 py-3 font-cute text-base text-ink shadow-[0_5px_0_rgba(122,70,88,0.13)] transition-transform active:translate-y-0.5 active:shadow-none"
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
