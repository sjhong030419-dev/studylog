interface PrimaryStudyActionProps {
  isRunning: boolean
  isPaused: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

/** Preserves the exact existing start/pause/resume/stop handlers and states. */
export function PrimaryStudyAction({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
}: PrimaryStudyActionProps) {
  return (
    <div className="flex gap-3 justify-center">
      {!isRunning && (
        <button
          type="button"
          onClick={onStart}
          className="font-cute px-8 py-3 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px]"
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
  )
}
