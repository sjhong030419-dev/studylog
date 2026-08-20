interface CaptureControlsProps {
  onShare: () => void
  onSave: () => void
  busy: boolean
}

/** Share/save controls, rendered outside the captured card (`cardRef`) so
 * they can never appear in the generated PNG — see `CaptureCardVisualHeader`
 * for what does stay inside (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §11). */
export function CaptureControls({ onShare, onSave, busy }: CaptureControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        aria-label="공유하기"
        className="w-11 h-11 rounded-full flex items-center justify-center text-base shadow-sm bg-white border border-ink/15 disabled:opacity-50"
      >
        🔗
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        aria-label="이미지로 저장"
        className="w-11 h-11 rounded-full flex items-center justify-center text-base shadow-sm bg-white border border-ink/15 disabled:opacity-50"
      >
        💾
      </button>
    </div>
  )
}
