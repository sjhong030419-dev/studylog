import { useEffect, useRef, useState } from 'react'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { usePlannerStore } from '../../store/plannerStore'
import { useProfileStore } from '../../store/profileStore'
import { useAwayDetection } from '../../hooks/useAwayDetection'
import { useMyAvatarAppearance } from '../../hooks/useMyAvatarAppearance'
import { CharacterRoomCard } from '../home/CharacterRoomCard'
import { SubjectChips } from '../home/SubjectChips'
import { StudyTimeSummary } from '../home/StudyTimeSummary'
import { SubjectBreakdownCard } from '../home/SubjectBreakdownCard'
import { SubjectEmptyState } from '../subjects/SubjectEmptyState'
import { computeDailyGoal } from '../../utils/dailyGoal'
import { deriveCharacterState } from '../../character/engine/characterStateMachine'
import { deriveSpeechBubble } from '../../utils/speechBubble'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { todayKey } from '../../utils/time'
import { activeSubjectsOf } from '../../store/subjectMath'
import { StudyRewardModal } from './StudyRewardModal'

/** Continuous focus beyond this length shows the sleepy pose — a deterministic
 * read of real elapsed session time, not a fabricated or random cue. */
const SLEEPY_THRESHOLD_SEC = 50 * 60
const CELEBRATION_MS = 2600

interface StudyTimerProps {
  onOpenShop: () => void
  onOpenCapture: () => void
}

interface StudyReward {
  durationSec: number
  earnedPoints: number
  balance: number
}

export function StudyTimer({ onOpenShop, onOpenCapture }: StudyTimerProps) {
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

  const plannerTasks = usePlannerStore((s) => s.tasks)
  const streakCount = usePointsStore((s) => s.streakCount)
  const studyXpTotal = usePointsStore((s) => s.studyXpTotal())
  const gender = useProfileStore((s) => s.gender)
  const appearance = useMyAvatarAppearance()

  const [awayMessage, setAwayMessage] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)
  const [justLeveledUp, setJustLeveledUp] = useState(false)
  const [studyReward, setStudyReward] = useState<StudyReward | null>(null)
  const completionTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (completionTimeoutRef.current !== undefined) window.clearTimeout(completionTimeoutRef.current)
    }
  }, [])

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

  // Level is re-derived from the same real Study XP (study-only lifetime
  // points) TimerPage uses (no separate stored value) purely to detect a
  // real level-up moment. Ad/bonus points never affect this.
  const level = deriveExpLevel(studyXpTotal)
  const prevLevelRef = useRef(level.level)

  useEffect(() => {
    if (level.level > prevLevelRef.current) {
      setJustLeveledUp(true)
      const id = window.setTimeout(() => setJustLeveledUp(false), CELEBRATION_MS)
      prevLevelRef.current = level.level
      return () => window.clearTimeout(id)
    }
    prevLevelRef.current = level.level
  }, [level.level])

  const handleStop = () => {
    const hadProgress = elapsedSec > 0
    const completedDurationSec = elapsedSec
    const balanceBefore = usePointsStore.getState().balance()
    stop()
    if (hadProgress) {
      const balanceAfter = usePointsStore.getState().balance()
      setStudyReward({
        durationSec: completedDurationSec,
        earnedPoints: Math.max(0, balanceAfter - balanceBefore),
        balance: balanceAfter,
      })
      if (completionTimeoutRef.current !== undefined) window.clearTimeout(completionTimeoutRef.current)
      setJustCompleted(true)
      completionTimeoutRef.current = window.setTimeout(() => {
        setJustCompleted(false)
        completionTimeoutRef.current = undefined
      }, CELEBRATION_MS)
    }
  }

  const isSleepy = isRunning && !isPaused && !awayMessage && elapsedSec >= SLEEPY_THRESHOLD_SEC

  const characterState = deriveCharacterState({
    isRunning,
    isPaused,
    isDistracted: Boolean(awayMessage),
    isSleepy,
    justCompleted,
    justLeveledUp,
  })

  const today = todaySessions(sessions)
  const todayTotalSec = today.reduce((sum, s) => sum + s.durationSec, 0)

  const perSubject = subjects
    .map((subject) => ({
      subject,
      sec: today.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationSec, 0),
    }))
    .filter((row) => row.sec > 0)

  const maxSec = Math.max(1, ...perSubject.map((r) => r.sec))
  const activeSubjects = activeSubjectsOf(subjects)
  const hasNoSubjects = activeSubjects.length === 0

  const goal = computeDailyGoal(plannerTasks, sessions, todayKey())
  const speech = awayMessage
    ? null
    : deriveSpeechBubble({ characterState, todayTotalSec, goal, streakCount })

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <CharacterRoomCard
        state={characterState}
        gender={gender}
        appearance={appearance}
        level={level.level}
        speech={speech}
      />

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

      {!hasNoSubjects && (
        <SubjectChips
          subjects={activeSubjects}
          selectedSubjectId={selectedSubjectId}
          disabled={isRunning}
          onSelect={selectSubject}
          onAdd={addSubject}
        />
      )}

      <StudyTimeSummary
        elapsedSec={elapsedSec}
        todayTotalSec={todayTotalSec}
        goal={goal}
        isRunning={isRunning}
        isPaused={isPaused}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onStop={handleStop}
        disabledReason={hasNoSubjects ? '과목을 먼저 추가해주세요.' : undefined}
      />

      {hasNoSubjects && <SubjectEmptyState onAdd={addSubject} reason="시작 버튼을 활성화하려면 공부할 과목 하나만 만들어주세요." />}

      <SubjectBreakdownCard perSubject={perSubject} maxSec={maxSec} />

      {studyReward && (
        <StudyRewardModal
          durationSec={studyReward.durationSec}
          earnedPoints={studyReward.earnedPoints}
          balance={studyReward.balance}
          onClose={() => setStudyReward(null)}
          onOpenQuests={() => {
            setStudyReward(null)
            window.requestAnimationFrame(() => {
              const questCard = document.getElementById('daily-quest-card')
              questCard?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              questCard?.focus({ preventScroll: true })
            })
          }}
          onOpenCapture={() => {
            setStudyReward(null)
            onOpenCapture()
          }}
          onOpenShop={() => {
            setStudyReward(null)
            onOpenShop()
          }}
        />
      )}
    </div>
  )
}
