import { useEffect, useState } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { activeSubjectsOf } from '../../store/subjectMath'
import { SubjectEmptyState } from '../subjects/SubjectEmptyState'
import { EXTRA_BUNDLE_COST, EXTRA_BUNDLE_SIZE, useTutorStore } from '../../store/tutorStore'

export function AiTutorChat() {
  const subjects = useTimerStore((s) => s.subjects)
  const addSubject = useTimerStore((s) => s.addSubject)
  const activeSubjects = activeSubjectsOf(subjects)
  const balance = usePointsStore((s) => s.balance())

  const messages = useTutorStore((s) => s.messages)
  const loading = useTutorStore((s) => s.loading)
  const error = useTutorStore((s) => s.error)
  const sendMessage = useTutorStore((s) => s.sendMessage)
  const buyExtraQuestions = useTutorStore((s) => s.buyExtraQuestions)
  const remaining = useTutorStore((s) => s.remainingToday())

  const [subjectId, setSubjectId] = useState(activeSubjects[0]?.id ?? '')
  const [input, setInput] = useState('')

  useEffect(() => {
    if (activeSubjects.some((s) => s.id === subjectId)) return
    setSubjectId(activeSubjects[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubjects])

  const subjectMessages = messages.filter((m) => m.subjectId === subjectId)

  function handleSend() {
    if (!input.trim() || remaining <= 0 || !subjectId) return
    sendMessage(subjectId, input)
    setInput('')
  }

  if (activeSubjects.length === 0) {
    return (
      <main className="min-h-screen px-4 pb-32 pt-6">
        <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-4">
        <div className="w-full text-left">
          <p className="font-cute text-[11px] tracking-wide text-ink-soft">ASK FOR A HINT</p>
          <h1 className="font-cute text-3xl text-ink">AI 튜터 🤖</h1>
        </div>
        <SubjectEmptyState onAdd={addSubject} reason="튜터에게 질문하려면 과목이 필요해요." />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 pb-32 pt-6">
      <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-4">
      <div className="w-full text-left">
        <p className="font-cute text-[11px] tracking-wide text-ink-soft">ASK FOR A HINT</p>
        <h1 className="font-cute text-3xl text-ink">AI 튜터 🤖</h1>
        <p className="mt-1 font-cute text-xs text-ink-soft">답을 대신 주기보다 스스로 풀 수 있는 다음 힌트를 찾아줘요.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {activeSubjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubjectId(s.id)}
            className={`font-cute min-h-[44px] px-3 py-1.5 rounded-full border text-sm ${
              subjectId === s.id ? 'border-ink text-ink' : 'border-ink/15 text-ink-soft'
            }`}
            style={{ backgroundColor: subjectId === s.id ? s.color : 'white' }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <p className="text-ink-soft text-xs font-cute">
        오늘 남은 질문 {Math.max(0, remaining)}개 · 정답 대신 힌트로 알려드려요
      </p>

      <div className="w-full max-w-sm flex-1 flex flex-col gap-2 bg-white/70 rounded-2xl shadow px-4 py-4 min-h-[280px]">
        {subjectMessages.length === 0 && (
          <p className="text-ink-soft text-sm text-center font-cute py-8">
            막히는 부분을 편하게 물어보세요!
          </p>
        )}
        {subjectMessages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm font-cute ${
              m.role === 'user'
                ? 'self-end bg-pastel-yellow text-ink'
                : 'self-start bg-pastel-lavender text-ink'
            }`}
          >
            {m.role === 'assistant' && <span className="mr-1">💡</span>}
            {m.content}
            {m.mock && (
              <span className="block text-[10px] text-ink-soft mt-1">(데모 응답 · API 키 미설정)</span>
            )}
          </div>
        ))}
        {loading && <p className="self-start text-ink-soft text-sm font-cute">튜터가 생각 중...</p>}
      </div>

      {error && <p className="text-red-400 text-xs font-cute text-center">{error}</p>}

      {remaining <= 0 ? (
        <button
          type="button"
          onClick={buyExtraQuestions}
          disabled={balance < EXTRA_BUNDLE_COST}
          className="font-cute px-6 py-2.5 rounded-full bg-pastel-mint text-ink shadow-md text-sm disabled:opacity-50"
        >
          포인트로 질문 {EXTRA_BUNDLE_SIZE}개 더 받기 ({EXTRA_BUNDLE_COST}P)
        </button>
      ) : (
        <div className="w-full max-w-sm flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="막히는 부분을 물어보세요"
            className="flex-1 font-cute text-sm px-4 py-2.5 rounded-full border border-ink/15 outline-none bg-white"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="font-cute px-5 py-2.5 rounded-full bg-ink text-white text-sm disabled:opacity-50"
          >
            전송
          </button>
        </div>
      )}
      </div>
    </main>
  )
}
