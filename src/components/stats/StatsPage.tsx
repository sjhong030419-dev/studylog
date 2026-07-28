import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { useTimerStore, todaySessions } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { useAwayStore } from '../../store/awayStore'
import { CalendarHeatmap } from './CalendarHeatmap'
import { PieChart } from './PieChart'
import { WeekdayBarChart } from './WeekdayBarChart'
import { formatDuration, dateKeyOffset, todayKey } from '../../utils/time'

type Period = 'week' | 'month'

export function StatsPage() {
  const subjects = useTimerStore((s) => s.subjects)
  const sessions = useTimerStore((s) => s.sessions)
  const streakCount = usePointsStore((s) => s.streakCount)
  const todayAwaySec = useAwayStore((s) => s.todayAwaySec())

  const [period, setPeriod] = useState<Period>('week')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const today = todayKey()
  const periodStart = period === 'week' ? dateKeyOffset(today, -6) : dateKeyOffset(today, -29)
  const periodSessions = sessions.filter((s) => s.dateKey >= periodStart && s.dateKey <= today)

  const pieData = subjects.map((subject) => ({
    label: subject.name,
    color: subject.color,
    value: periodSessions.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationSec, 0),
  }))

  const totalAllTimeSec = sessions.reduce((sum, s) => sum + s.durationSec, 0)
  const todayStudySec = todaySessions(sessions).reduce((sum, s) => sum + s.durationSec, 0)

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    setError(false)
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('이미지 생성 시간이 초과됐어요')), 10000),
      )
      const dataUrl = await Promise.race([
        toPng(cardRef.current, { pixelRatio: 2, cacheBust: true }),
        timeout,
      ])
      const link = document.createElement('a')
      link.download = `studylog-stats-${today}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('통계 이미지 저장 실패:', e)
      setError(true)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <div
        ref={cardRef}
        className="w-full rounded-3xl p-5 flex flex-col gap-3"
        style={{ background: 'linear-gradient(160deg, #fdf1ff 0%, #eaf2ff 55%, #eafff5 100%)' }}
      >
        <div className="flex items-center justify-between">
          <span className="font-cute text-ink text-lg">스터디로그 통계</span>
          <span className="font-cute text-ink-soft text-xs">{today}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/60 rounded-2xl px-2 py-3 flex flex-col items-center gap-0.5">
            <span className="font-pixel text-ink text-xs">{formatDuration(totalAllTimeSec)}</span>
            <span className="text-ink-soft text-[10px] font-cute">누적</span>
          </div>
          <div className="bg-white/60 rounded-2xl px-2 py-3 flex flex-col items-center gap-0.5">
            <span className="font-pixel text-ink text-xs">{formatDuration(todayStudySec)}</span>
            <span className="text-ink-soft text-[10px] font-cute">오늘 순공부</span>
          </div>
          <div className="bg-white/60 rounded-2xl px-2 py-3 flex flex-col items-center gap-0.5">
            <span className="font-pixel text-ink text-xs">🔥{streakCount}일</span>
            <span className="text-ink-soft text-[10px] font-cute">연속출석</span>
          </div>
        </div>

        <CalendarHeatmap sessions={sessions} />
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="font-cute px-6 py-2.5 rounded-full bg-pastel-yellow text-ink shadow-md text-sm disabled:opacity-60"
      >
        {downloading ? '저장 중...' : '이미지로 저장'}
      </button>
      {error && <p className="text-red-400 text-xs font-cute text-center">이미지 생성에 실패했어요.</p>}

      <div className="w-full bg-white/70 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex flex-col items-center flex-1">
          <span className="font-pixel text-ink text-sm">{formatDuration(todayStudySec)}</span>
          <span className="text-ink-soft text-[10px] font-cute">오늘 순공부시간</span>
        </div>
        <div className="w-px h-8 bg-ink/10" />
        <div className="flex flex-col items-center flex-1">
          <span className="font-pixel text-ink-soft text-sm">{formatDuration(todayAwaySec)}</span>
          <span className="text-ink-soft text-[10px] font-cute">오늘 이탈시간</span>
        </div>
      </div>

      <div className="w-full bg-white/70 rounded-2xl px-4 py-4 shadow-sm flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`font-cute text-xs px-3 py-1 rounded-full border ${
              period === 'week' ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
            }`}
          >
            이번주
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`font-cute text-xs px-3 py-1 rounded-full border ${
              period === 'month' ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
            }`}
          >
            이번달
          </button>
        </div>
        <span className="font-cute text-ink-soft text-sm">과목별 시간 비중</span>
        <PieChart data={pieData} />
      </div>

      <div className="w-full bg-white/70 rounded-2xl px-4 py-4 shadow-sm">
        <WeekdayBarChart sessions={sessions} />
      </div>
    </div>
  )
}
