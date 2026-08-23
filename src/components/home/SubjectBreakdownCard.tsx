import type { Subject } from '../../types'
import { formatDuration } from '../../utils/time'

interface SubjectBreakdownCardProps {
  perSubject: { subject: Subject; sec: number }[]
  maxSec: number
}

/** Preserves the existing per-subject today breakdown, unchanged data. */
export function SubjectBreakdownCard({ perSubject, maxSec }: SubjectBreakdownCardProps) {
  return (
    <div className="w-full rounded-[24px] border-2 border-white/85 bg-white/60 px-4 py-4 shadow-[0_5px_0_rgba(84,62,94,0.07),0_12px_26px_rgba(84,62,94,0.08)] backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="font-cute text-ink text-sm">📚 모험별 경험치 기록</span>
        <span className="rounded-full bg-pastel-mint px-2 py-1 font-cute text-[9px] text-ink-soft">TODAY</span>
      </div>

      {perSubject.length === 0 && (
        <p className="text-ink-soft text-sm text-center py-2">아직 기록이 없어요. 타이머를 시작해보세요!</p>
      )}

      <div className="flex flex-col gap-2 mt-3">
        {perSubject.map(({ subject, sec }) => (
          <div key={subject.id} className="flex items-center gap-2">
            <span className="font-cute text-sm w-12 shrink-0 text-ink-soft">{subject.name}</span>
            <div className="flex-1 h-3 rounded-full bg-ink/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(sec / maxSec) * 100}%`, backgroundColor: subject.color }}
              />
            </div>
            <span className="font-pixel text-[10px] text-ink-soft w-14 text-right">
              {formatDuration(sec)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
