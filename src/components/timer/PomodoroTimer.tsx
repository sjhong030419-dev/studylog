import { useEffect, useState } from 'react'
import { CharacterView } from '../../character/components/CharacterView'
import { useMyAvatarAppearance } from '../../hooks/useMyAvatarAppearance'
import { useProfileStore } from '../../store/profileStore'
import { useTimerStore } from '../../store/timerStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { activeSubjectsOf } from '../../store/subjectMath'
import { SubjectEmptyState } from '../subjects/SubjectEmptyState'
import type { CharacterState } from '../../character/types'

const PRESETS = [
  { label: '25분 집중 / 5분 휴식', focus: 25, rest: 5 },
  { label: '50분 집중 / 10분 휴식', focus: 50, rest: 10 },
]

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PomodoroTimer() {
  const subjects = useTimerStore((s) => s.subjects)
  const addSubject = useTimerStore((s) => s.addSubject)
  const activeSubjects = activeSubjectsOf(subjects)

  const phase = usePomodoroStore((s) => s.phase)
  const remainingSec = usePomodoroStore((s) => s.remainingSec)
  const currentRound = usePomodoroStore((s) => s.currentRound)
  const totalRounds = usePomodoroStore((s) => s.totalRounds)
  const isPaused = usePomodoroStore((s) => s.isPaused)
  const completedRoundsToday = usePomodoroStore((s) => s.completedRoundsToday)

  const start = usePomodoroStore((s) => s.start)
  const pause = usePomodoroStore((s) => s.pause)
  const resume = usePomodoroStore((s) => s.resume)
  const stop = usePomodoroStore((s) => s.stop)
  const reset = usePomodoroStore((s) => s.reset)
  const tick = usePomodoroStore((s) => s.tick)

  const [subjectId, setSubjectId] = useState(activeSubjects[0]?.id ?? '')
  const [customFocus, setCustomFocus] = useState(25)
  const [customBreak, setCustomBreak] = useState(5)
  const [customRounds, setCustomRounds] = useState(4)
  const gender = useProfileStore((s) => s.gender)
  const appearance = useMyAvatarAppearance()

  useEffect(() => {
    if (phase !== 'focus' && phase !== 'break') return
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [phase, tick])

  // Keep the local selection valid as subjects are added/removed elsewhere
  // (e.g. right after creating the first subject from the empty state) —
  // never leaves a stale/empty id selected once real subjects exist.
  useEffect(() => {
    if (activeSubjects.some((s) => s.id === subjectId)) return
    setSubjectId(activeSubjects[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubjects])

  const state: CharacterState = isPaused ? 'break' : phase === 'focus' ? 'study' : 'idle'

  if (phase === 'idle' && activeSubjects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <SubjectEmptyState onAdd={addSubject} reason="뽀모도로를 시작하려면 과목이 필요해요." />
      </div>
    )
  }

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="flex flex-wrap justify-center gap-2 max-w-sm">
          {activeSubjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectId(subject.id)}
              className={`font-cute min-h-[44px] px-3 py-1.5 rounded-full border text-sm ${
                subjectId === subject.id ? 'border-ink text-ink' : 'border-ink/15 text-ink-soft'
              }`}
              style={{ backgroundColor: subjectId === subject.id ? subject.color : 'white' }}
            >
              {subject.name}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm flex flex-col gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => start(subjectId, preset.focus, preset.rest, 4)}
              className="font-cute bg-white/70 rounded-2xl px-5 py-3 shadow-sm text-ink text-sm text-left"
            >
              🍅 {preset.label}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm bg-white/70 rounded-2xl px-5 py-4 shadow-sm flex flex-col gap-3">
          <span className="font-cute text-ink-soft text-sm">커스텀 설정</span>
          <div className="flex items-center gap-2">
            <label className="font-cute text-xs text-ink-soft w-16">집중(분)</label>
            <input
              type="number"
              min={1}
              value={customFocus}
              onChange={(e) => setCustomFocus(Math.max(1, Number(e.target.value)))}
              className="flex-1 font-pixel text-sm px-3 py-1.5 rounded-lg border border-ink/15 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-cute text-xs text-ink-soft w-16">휴식(분)</label>
            <input
              type="number"
              min={0}
              value={customBreak}
              onChange={(e) => setCustomBreak(Math.max(0, Number(e.target.value)))}
              className="flex-1 font-pixel text-sm px-3 py-1.5 rounded-lg border border-ink/15 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-cute text-xs text-ink-soft w-16">반복(회)</label>
            <input
              type="number"
              min={1}
              value={customRounds}
              onChange={(e) => setCustomRounds(Math.max(1, Number(e.target.value)))}
              className="flex-1 font-pixel text-sm px-3 py-1.5 rounded-lg border border-ink/15 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => start(subjectId, customFocus, customBreak, customRounds)}
            className="font-cute px-5 py-2.5 rounded-full bg-pastel-yellow text-ink shadow-md text-sm"
          >
            커스텀으로 시작
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <CharacterView state="happy" gender={gender} appearance={appearance} size={140} />
        <span className="font-cute text-2xl text-ink">뽀모도로 완료! 🎉</span>
        <div className="bg-white/70 rounded-2xl px-8 py-5 shadow-sm flex flex-col items-center gap-1">
          <span className="text-ink-soft text-sm font-cute">오늘 완료한 세트</span>
          <span className="font-pixel text-ink text-2xl">{completedRoundsToday}세트</span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="font-cute px-8 py-3 rounded-full bg-pastel-yellow text-ink shadow-md text-lg"
        >
          다시 시작
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="bg-white/70 backdrop-blur rounded-3xl shadow-lg px-10 py-8 flex flex-col items-center gap-4">
        <CharacterView state={state} gender={gender} appearance={appearance} size={140} />
        <span className="font-cute text-ink text-sm">
          {phase === 'focus' ? '🔥 집중 시간' : '☕ 휴식 시간'} · {currentRound}/{totalRounds} 세트
        </span>
        <div className="font-pixel text-3xl text-ink tracking-widest">{formatCountdown(remainingSec)}</div>
      </div>

      <div className="flex gap-3">
        {!isPaused ? (
          <button
            type="button"
            onClick={pause}
            className="font-cute px-8 py-3 rounded-full bg-pastel-lavender text-ink shadow-md text-lg"
          >
            일시정지
          </button>
        ) : (
          <button
            type="button"
            onClick={resume}
            className="font-cute px-8 py-3 rounded-full bg-pastel-mint text-ink shadow-md text-lg"
          >
            재개
          </button>
        )}
        <button
          type="button"
          onClick={stop}
          className="font-cute px-8 py-3 rounded-full bg-white border border-ink/20 text-ink shadow-md text-lg"
        >
          종료
        </button>
      </div>
    </div>
  )
}
