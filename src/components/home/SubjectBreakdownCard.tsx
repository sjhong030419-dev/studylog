import type { Subject } from '../../types'
import { formatDuration } from '../../utils/time'

interface SubjectBreakdownCardProps {
  perSubject: { subject: Subject; sec: number }[]
  maxSec: number
}

/** Preserves the existing per-subject today breakdown, unchanged data. */
export function SubjectBreakdownCard({ perSubject, maxSec }: SubjectBreakdownCardProps) {
  return (
    <div className="w-full bg-white/70 backdrop-blur rounded-2xl shadow px-5 py-4">
      <span className="font-cute text-ink text-sm">과목별 오늘 공부시간</span>

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
