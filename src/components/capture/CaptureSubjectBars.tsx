import { formatDuration } from '../../utils/time'
import type { Subject } from '../../types'

interface CaptureSubjectBarsProps {
  perSubject: { subject: Subject; sec: number }[]
  maxSec: number
  /** Caps rows shown in cramped layouts (square ratio) — the full list is
   * still available in the wider 9:16 layout. */
  maxRows?: number
  compact?: boolean
}

/** Horizontal bars, not a pie chart, per the capture-card spec. */
export function CaptureSubjectBars({ perSubject, maxSec, maxRows, compact = false }: CaptureSubjectBarsProps) {
  const rows = maxRows ? perSubject.slice(0, maxRows) : perSubject

  return (
    <div
      className={`w-full flex flex-col rounded-xl shadow-sm ${compact ? 'gap-1 px-1.5 py-1' : 'gap-1.5 px-2 py-2'}`}
      style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.6)' }}
    >
      {rows.length === 0 ? (
        <p className="text-ink-soft text-[10px] text-center font-cute py-1">
          아직 기록이 없어요. 타이머를 먼저 실행해보세요!
        </p>
      ) : (
        rows.map(({ subject, sec }) => (
          <div key={subject.id} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: subject.color, boxShadow: `0 0 0 2px ${subject.color}33` }}
              aria-hidden="true"
            />
            <span className="font-cute text-[10px] w-9 shrink-0 text-ink truncate">{subject.name}</span>
            <div className="flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(sec / maxSec) * 100}%`, backgroundColor: subject.color }}
              />
            </div>
            <span className="font-pixel text-[8px] text-ink-soft w-11 text-right shrink-0">
              {formatDuration(sec)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}
