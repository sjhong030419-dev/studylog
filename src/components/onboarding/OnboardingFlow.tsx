import { useState } from 'react'
import { CharacterView } from '../../character/components/CharacterView'
import { useProfileStore } from '../../store/profileStore'
import { useTimerStore } from '../../store/timerStore'
import { usePlannerStore } from '../../store/plannerStore'
import { activeSubjectsOf } from '../../store/subjectMath'
import { todayKey } from '../../utils/time'
import { parseGoalMinutes } from '../../utils/goalMinutes'
import type { Gender } from '../../character/types'

type Step = 'welcome' | 'character' | 'nickname' | 'subject' | 'goal'

const STEP_ORDER: Step[] = ['welcome', 'character', 'nickname', 'subject', 'goal']

/**
 * First-run flow only (PRD §18-19). Steps 6-8 of the target flow (start
 * first study -> earn first Study XP -> see first result card) are
 * intentionally NOT reproduced here — "explain by doing" means handing the
 * user to the real TimerPage/LogCaptureCard for those, not simulating them
 * in a tutorial. The first reward is whatever real Study XP their first
 * real session earns, through the existing deterministic (non-ad,
 * non-random) `earnFromStudySession` path — nothing is granted here.
 */
export function OnboardingFlow() {
  const [step, setStep] = useState<Step>('welcome')
  const [localGender, setLocalGender] = useState<Gender>('boy')
  const [localNickname, setLocalNickname] = useState('')
  const [goalMinutes, setGoalMinutes] = useState('')
  const [goalError, setGoalError] = useState<string | null>(null)
  const [subjectStepError, setSubjectStepError] = useState<string | null>(null)

  const setGender = useProfileStore((s) => s.setGender)
  const setNickname = useProfileStore((s) => s.setNickname)
  const completeOnboarding = useProfileStore((s) => s.completeOnboarding)

  const subjects = useTimerStore((s) => s.subjects)
  const selectedSubjectId = useTimerStore((s) => s.selectedSubjectId)
  const selectSubject = useTimerStore((s) => s.selectSubject)
  const addSubject = useTimerStore((s) => s.addSubject)
  const addTask = usePlannerStore((s) => s.addTask)
  const activeSubjects = activeSubjectsOf(subjects)

  const stepIndex = STEP_ORDER.indexOf(step)

  function goNext() {
    if (step === 'subject' && activeSubjects.length === 0) {
      setSubjectStepError('최소 하나의 과목을 만들어야 다음으로 진행할 수 있어요.')
      return
    }
    const next = STEP_ORDER[stepIndex + 1]
    if (next) setStep(next)
  }

  function finish() {
    const goalResult = parseGoalMinutes(goalMinutes)
    if (!goalResult.valid) {
      setGoalError(goalResult.error)
      return
    }

    setGender(localGender)
    if (localNickname.trim()) setNickname(localNickname)
    if (goalResult.minutes !== null && selectedSubjectId) {
      addTask(todayKey(), selectedSubjectId, '오늘의 목표', 'time', goalResult.minutes)
    }
    completeOnboarding()
  }

  function skipAll() {
    completeOnboarding()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 py-10 bg-gradient-to-b from-[#fdf6ff] to-[#eef4ff] dark:from-[#1c1830] dark:to-[#14121f]">
      {step !== 'welcome' && (
        <div className="w-full max-w-sm flex items-center justify-between">
          <div className="flex gap-1">
            {STEP_ORDER.slice(1).map((s) => (
              <div
                key={s}
                className={`h-1.5 w-6 rounded-full ${
                  STEP_ORDER.indexOf(s) <= stepIndex ? 'bg-pastel-lavender' : 'bg-ink/10'
                }`}
              />
            ))}
          </div>
          <button type="button" onClick={skipAll} className="font-cute text-xs text-ink-soft">
            건너뛰기
          </button>
        </div>
      )}

      {step === 'welcome' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="flex gap-2">
            <CharacterView state="happy" gender="boy" size={100} animated />
            <CharacterView state="happy" gender="girl" size={100} animated />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-cute text-2xl text-ink">스터디로그에 오신 걸 환영해요 📖</h1>
            <p className="font-cute text-sm text-ink-soft">
              캐릭터와 함께, 오늘도 공부를 기록해봐요.
            </p>
          </div>
          <button
            type="button"
            onClick={goNext}
            className="font-cute w-full px-8 py-3.5 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px]"
          >
            시작하기
          </button>
          <button type="button" onClick={skipAll} className="font-cute text-xs text-ink-soft">
            나중에 할게요
          </button>
        </div>
      )}

      {step === 'character' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <h2 className="font-cute text-xl text-ink text-center">어떤 캐릭터로 시작할까요?</h2>
          <div className="flex gap-4">
            {(['boy', 'girl'] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setLocalGender(g)}
                className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 ${
                  localGender === g ? 'border-ink bg-white' : 'border-transparent bg-white/60'
                }`}
              >
                <CharacterView state="idle" gender={g} size={110} animated />
                <span className="font-cute text-sm text-ink">{g === 'boy' ? '남학생' : '여학생'}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="font-cute w-full px-8 py-3.5 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px]"
          >
            다음
          </button>
        </div>
      )}

      {step === 'nickname' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <h2 className="font-cute text-xl text-ink text-center">뭐라고 부르면 될까요?</h2>
          <CharacterView state="idle" gender={localGender} size={100} animated />
          <input
            type="text"
            value={localNickname}
            onChange={(e) => setLocalNickname(e.target.value.slice(0, 12))}
            placeholder="닉네임 (선택, 기본값: 나)"
            maxLength={12}
            className="w-full font-cute text-base px-4 py-3 rounded-full bg-white border border-ink/20 text-ink text-center"
          />
          <button
            type="button"
            onClick={goNext}
            className="font-cute w-full px-8 py-3.5 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px]"
          >
            다음
          </button>
        </div>
      )}

      {step === 'subject' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <h2 className="font-cute text-xl text-ink text-center">어떤 과목을 공부할까요?</h2>
          <p className="font-cute text-xs text-ink-soft text-center">
            나만의 과목을 직접 만들어보세요. 나중에 얼마든지 추가·삭제할 수 있어요.
          </p>
          {activeSubjects.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {activeSubjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => selectSubject(subject.id)}
                  className={`font-cute px-4 py-2 rounded-full border text-sm min-h-[40px] ${
                    selectedSubjectId === subject.id ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          )}
          <AddSubjectField
            onAdd={(name) => {
              const result = addSubject(name)
              if (result.ok) setSubjectStepError(null)
              return result
            }}
          />
          {subjectStepError && (
            <p role="alert" className="font-cute text-xs text-red-500 text-center">
              {subjectStepError}
            </p>
          )}
          <button
            type="button"
            onClick={goNext}
            className="font-cute w-full px-8 py-3.5 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px]"
          >
            다음
          </button>
        </div>
      )}

      {step === 'goal' && (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <h2 className="font-cute text-xl text-ink text-center">오늘 목표 시간을 정해볼까요?</h2>
          <p className="font-cute text-xs text-ink-soft text-center">선택 사항이에요. 나중에 바꿀 수 있어요.</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={goalMinutes}
              onChange={(e) => {
                setGoalMinutes(e.target.value)
                setGoalError(null)
              }}
              placeholder="30"
              aria-invalid={goalError !== null}
              className="w-24 font-cute text-lg px-4 py-3 rounded-full bg-white border border-ink/20 text-ink text-center"
            />
            <span className="font-cute text-ink-soft">분</span>
          </div>
          {goalError && (
            <p role="alert" className="font-cute text-xs text-red-500 text-center">
              {goalError}
            </p>
          )}
          <button
            type="button"
            onClick={finish}
            className="font-cute w-full px-8 py-3.5 rounded-full bg-pastel-yellow text-ink shadow-md text-lg min-h-[44px]"
          >
            공부 시작하러 가기
          </button>
          {!goalMinutes && (
            <button type="button" onClick={finish} className="font-cute text-xs text-ink-soft">
              목표 없이 시작할게요
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AddSubjectField({
  onAdd,
}: {
  onAdd: (name: string) => { ok: true } | { ok: false; error: string }
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    const result = onAdd(value)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setValue('')
    setError(null)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.slice(0, 20))
            setError(null)
          }}
          placeholder="예: 토익, 코딩, 자격증"
          maxLength={20}
          className="font-cute text-sm px-4 py-2 rounded-full bg-white border border-ink/20 text-ink"
        />
        <button
          type="submit"
          className="font-cute text-sm px-4 py-2 rounded-full bg-ink text-white min-h-[40px]"
        >
          + 추가
        </button>
      </div>
      {error && (
        <p role="alert" className="font-cute text-xs text-red-500">
          {error}
        </p>
      )}
    </form>
  )
}
