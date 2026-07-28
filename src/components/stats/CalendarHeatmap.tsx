import type { StudySession } from '../../types'
import { todayKey } from '../../utils/time'

interface CalendarHeatmapProps {
  sessions: StudySession[]
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function levelColor(minutes: number): string {
  if (minutes <= 0) return 'rgba(74,68,88,0.06)'
  if (minutes < 30) return '#ffe9ab'
  if (minutes < 60) return '#ffd27a'
  if (minutes < 120) return '#ffb84d'
  return '#e08a2b'
}

export function CalendarHeatmap({ sessions }: CalendarHeatmapProps) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstDay.getDay()

  const minutesByDate = new Map<string, number>()
  for (const s of sessions) {
    minutesByDate.set(s.dateKey, (minutesByDate.get(s.dateKey) ?? 0) + s.durationSec / 60)
  }

  const cells: { dateKey: string | null; day: number | null; minutes: number }[] = []
  for (let i = 0; i < startWeekday; i++) cells.push({ dateKey: null, day: null, minutes: 0 })
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ dateKey, day, minutes: minutesByDate.get(dateKey) ?? 0 })
  }

  const today = todayKey()

  return (
    <div className="w-full flex flex-col gap-2">
      <span className="font-cute text-ink-soft text-sm">
        {year}년 {month + 1}월 잔디밭
      </span>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((d) => (
          <span key={d} className="text-center text-[9px] font-cute text-ink-soft">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className="aspect-square rounded-md flex items-center justify-center"
            style={{
              backgroundColor: cell.dateKey ? levelColor(cell.minutes) : 'transparent',
              outline: cell.dateKey === today ? '1.5px solid #4a4458' : undefined,
            }}
            title={cell.dateKey ? `${cell.dateKey}: ${Math.round(cell.minutes)}분` : undefined}
          >
            {cell.day && <span className="text-[8px] font-pixel text-ink/50">{cell.day}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
