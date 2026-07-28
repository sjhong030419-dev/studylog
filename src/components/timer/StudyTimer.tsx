import { useEffect, useState } from 'react'
import { DotAvatar } from '../avatar/DotAvatar'
import { deriveAvatarStatus, todaySessions, useTimerStore } from '../../store/timerStore'
import { formatDuration } from '../../utils/time'
import { useAwayDetection } from '../../hooks/useAwayDetection'

export function StudyTimer() {
  const subjects = useTimerStore((s) => s.subjects)
  const selectedSubjectId = useTimerStore((s) => s.selectedSubjectId)
  const isRunning = useTimerStore((s) => s.isRunning)
  const isPaused = useTimerStore((s) => s.isPaused)
  const elapsedSec = useTimerStore((s) => s.elapsedSec)
  const sessions = useTimerStore((s) => s.sessions)

  const selectSubject = useTimerStore((s) => s.selectSubject)
  const addSubject = useTimerStore((s) => s.addSubject)
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const resume = useTimerStore((s) => s.resume)
  const stop = useTimerStore((s) => s.stop)
  const tick = useTimerStore((s) => s.tick)

  const [addingSubject, setAddingSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [awayMessage, setAwayMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isRunning || isPaused) return
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [isRunning, isPaused, tick])

  useAwayDetection({
    active: isRunning && !isPaused,
    onHide: () => pause(),
    onShortReturn: () => resume(),
    onLongReturn: (awaySec) => {
      const min = Math.round(awaySec / 60)
      setAwayMessage(
        min < 1
          ? `${awaySec}초 자리 비웠어요! 몰래 딴짓했죠? 👀`
          : `${min}분 자리 비웠어요! 슬쩍 돌아왔네요 👋`,
      )
    },
  })

  const baseStatus = deriveAvatarStatus({ isRunning, isPaused })
  const status = awayMessage ? 'away' : baseStatus
  const today = todaySessions(sessions)
  const todayTotalSec = today.reduce((sum, s) => sum + s.durationSec, 0)

  const perSubject = subjects
    .map((subject) => ({
      subject,
      sec: today.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationSec, 0),
    }))
    .filter((row) => row.sec > 0)

  const maxSec = Math.max(1, ...perSubject.map((r) => r.sec))

  function handleAddSubject() {
    addSubject(newSubjectName)
    setNewSubjectName('')
    setAddingSubject(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="bg-white/70 backdrop-blur rounded-3xl shadow-lg px-10 py-8 flex flex-col items-center gap-4">
        <DotAvatar status={status} pixelSize={16} />
        <div className="font-pixel text-3xl text-ink tracking-widest">
          {formatDuration(elapsedSec)}
        </div>
      </div>

      {awayMessage && (
        <div className="w-full max-w-sm bg-pastel-pink/70 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
          <span className="font-cute text-ink text-sm">{awayMessage}</span>
          <button
            type="button"
            onClick={() => {
              setAwayMessage(null)
              resume()
            }}
            className="font-cute text-xs px-3 py-1.5 rounded-full bg-ink text-white shrink-0"
          >
            다시 집중하기 🔥
          </button>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            disabled={isRunning}
            onClick={() => selectSubject(subject.id)}
            className={`font-cute px-3 py-1.5 rounded-full border text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedSubjectId === subject.id
                ? 'border-ink text-ink'
                : 'border-ink/15 text-ink-soft hover:border-ink/40'
            }`}
            style={{
              backgroundColor: selectedSubjectId === subject.id ? subject.color : 'white',
            }}
          >
            {subject.name}
          </button>
        ))}

        {!addingSubject && (
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setAddingSubject(true)}
            className="font-cute px-3 py-1.5 rounded-full border border-dashed border-ink/30 text-sm text-ink-soft disabled:opacity-50"
          >
            + 과목 추가
          </button>
        )}

        {addingSubject && (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="과목 이름"
              className="font-cute px-3 py-1.5 rounded-full border border-ink/30 text-sm outline-none w-24"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="font-cute px-2 py-1.5 rounded-full bg-ink text-white text-sm"
            >
              확인
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isRunning && (
          <button
            type="button"
            onClick={start}
            className="font-cute px-8 py-3 rounded-full bg-pastel-yellow text-ink shadow-md text-lg"
          >
            시작
          </button>
        )}
        {isRunning && !isPaused && (
          <button
            type="button"
            onClick={pause}
            className="font-cute px-8 py-3 rounded-full bg-pastel-lavender text-ink shadow-md text-lg"
          >
            일시정지
          </button>
        )}
        {isRunning && isPaused && (
          <button
            type="button"
            onClick={resume}
            className="font-cute px-8 py-3 rounded-full bg-pastel-mint text-ink shadow-md text-lg"
          >
            재개
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            onClick={stop}
            className="font-cute px-8 py-3 rounded-full bg-white border border-ink/20 text-ink shadow-md text-lg"
          >
            종료
          </button>
        )}
      </div>

      <div className="w-full max-w-sm bg-white/70 backdrop-blur rounded-2xl shadow px-5 py-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="font-cute text-ink">오늘 공부 시간</span>
          <span className="font-pixel text-ink text-sm">{formatDuration(todayTotalSec)}</span>
        </div>

        {perSubject.length === 0 && (
          <p className="text-ink-soft text-sm text-center py-2">아직 기록이 없어요. 타이머를 시작해보세요!</p>
        )}

        <div className="flex flex-col gap-2">
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
    </div>
  )
}
