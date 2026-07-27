import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { DotAvatar } from '../avatar/DotAvatar'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { formatDuration } from '../../utils/time'

type Ratio = 'square' | 'story'

const RATIO_CLASS: Record<Ratio, string> = {
  square: 'aspect-square',
  story: 'aspect-[9/16]',
}

function formatDate(date = new Date()): string {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const m = date.getMonth() + 1
  const d = date.getDate()
  const day = days[date.getDay()]
  return `${m}월 ${d}일 (${day})`
}

export function LogCaptureCard() {
  const subjects = useTimerStore((s) => s.subjects)
  const sessions = useTimerStore((s) => s.sessions)
  const [ratio, setRatio] = useState<Ratio>('square')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const today = todaySessions(sessions)
  const todayTotalSec = today.reduce((sum, s) => sum + s.durationSec, 0)
  const perSubject = subjects
    .map((subject) => ({
      subject,
      sec: today.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationSec, 0),
    }))
    .filter((row) => row.sec > 0)
    .sort((a, b) => b.sec - a.sec)

  const maxSec = Math.max(1, ...perSubject.map((r) => r.sec))

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
      link.download = `studylog-${todayKeyForFile()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('이미지 저장 실패:', e)
      setError(true)
    } finally {
      setDownloading(false)
    }
  }

  function todayKeyForFile() {
    const now = new Date()
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">오늘의 기록 📸</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRatio('square')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            ratio === 'square' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          정사각형 (피드)
        </button>
        <button
          type="button"
          onClick={() => setRatio('story')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            ratio === 'story' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          9:16 (스토리)
        </button>
      </div>

      <div
        ref={cardRef}
        className={`w-[320px] ${RATIO_CLASS[ratio]} rounded-3xl overflow-hidden flex flex-col items-center justify-between px-6 py-7 relative`}
        style={{
          background: 'linear-gradient(160deg, #fdf1ff 0%, #eaf2ff 55%, #eafff5 100%)',
        }}
      >
        <div className="w-full flex items-center justify-between">
          <span className="font-cute text-ink text-lg">스터디로그</span>
          <span className="font-cute text-ink-soft text-sm">{formatDate()}</span>
        </div>

        <DotAvatar status="resting" pixelSize={ratio === 'story' ? 18 : 14} />

        <div className="flex flex-col items-center gap-1">
          <span className="font-cute text-ink-soft text-sm">오늘 총 공부 시간</span>
          <span className="font-pixel text-ink text-2xl tracking-widest">
            {formatDuration(todayTotalSec)}
          </span>
        </div>

        <div className="w-full flex flex-col gap-2">
          {perSubject.length === 0 && (
            <p className="text-ink-soft text-xs text-center font-cute">
              아직 기록이 없어요. 타이머를 먼저 실행해보세요!
            </p>
          )}
          {perSubject.map(({ subject, sec }) => (
            <div key={subject.id} className="flex items-center gap-2">
              <span className="font-cute text-xs w-10 shrink-0 text-ink">{subject.name}</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(sec / maxSec) * 100}%`, backgroundColor: subject.color }}
                />
              </div>
              <span className="font-pixel text-[9px] text-ink-soft w-12 text-right">
                {formatDuration(sec)}
              </span>
            </div>
          ))}
        </div>

        <span className="font-cute text-ink-soft text-xs">#스터디로그 #공스타그램</span>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="font-cute px-8 py-3 rounded-full bg-pastel-yellow text-ink shadow-md text-lg disabled:opacity-60"
      >
        {downloading ? '저장 중...' : '이미지로 저장'}
      </button>
      {error && (
        <p className="text-red-400 text-sm font-cute">
          이미지 생성에 실패했어요. 다시 시도해주세요.
        </p>
      )}
    </div>
  )
}
