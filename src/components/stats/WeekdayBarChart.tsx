import type { StudySession } from '../../types'

interface WeekdayBarChartProps {
  sessions: StudySession[]
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function WeekdayBarChart({ sessions }: WeekdayBarChartProps) {
  const secByWeekday: number[] = [0, 0, 0, 0, 0, 0, 0]
  const dateSet = new Set<string>()
  const dateWeekday = new Map<string, number>()

  for (const s of sessions) {
    dateSet.add(s.dateKey)
    if (!dateWeekday.has(s.dateKey)) {
      const [y, m, d] = s.dateKey.split('-').map(Number)
      dateWeekday.set(s.dateKey, new Date(y, m - 1, d).getDay())
    }
    const wd = dateWeekday.get(s.dateKey)!
    secByWeekday[wd] += s.durationSec
  }

  const daysCountByWeekday = [0, 0, 0, 0, 0, 0, 0]
  for (const dateKey of dateSet) {
    daysCountByWeekday[dateWeekday.get(dateKey)!] += 1
  }

  const avgMinByWeekday = secByWeekday.map((sec, i) =>
    daysCountByWeekday[i] > 0 ? sec / 60 / daysCountByWeekday[i] : 0,
  )
  const maxAvg = Math.max(1, ...avgMinByWeekday)

  return (
    <div className="w-full flex flex-col gap-2">
      <span className="font-cute text-ink-soft text-sm">요일별 평균 공부시간</span>
      <div className="flex items-end justify-between gap-1.5 h-24">
        {avgMinByWeekday.map((min, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-pastel-blue"
              style={{ height: `${Math.max(2, (min / maxAvg) * 80)}px` }}
            />
            <span className="text-[9px] font-cute text-ink-soft">{WEEKDAY_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
