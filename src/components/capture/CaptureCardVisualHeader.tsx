interface CaptureCardVisualHeaderProps {
  dateLabel: string
}

/** Decorative-only header that stays inside the captured card (`cardRef`).
 * No buttons or interactive affordances live here — see `CaptureControls`
 * for the share/save UI, which is rendered outside the captured node
 * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §11). */
export function CaptureCardVisualHeader({ dateLabel }: CaptureCardVisualHeaderProps) {
  return (
    <div className="w-full flex items-center justify-between shrink-0 relative z-10">
      <span
        className="font-cute text-ink text-sm px-2.5 py-1 rounded-full bg-white/50"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        {dateLabel}
      </span>
      <span className="font-cute text-ink-soft text-xs px-2.5 py-1">스터디로그</span>
    </div>
  )
}
