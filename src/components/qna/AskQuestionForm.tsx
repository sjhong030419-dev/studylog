import { useState } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { ASK_QUESTION_COST, useQnaStore } from '../../store/qnaStore'

interface AskQuestionFormProps {
  onDone: () => void
  onCancel: () => void
}

export function AskQuestionForm({ onDone, onCancel }: AskQuestionFormProps) {
  const subjects = useTimerStore((s) => s.subjects)
  const balance = usePointsStore((s) => s.balance())
  const askQuestion = useQnaStore((s) => s.askQuestion)

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const canAfford = balance >= ASK_QUESTION_COST

  function handleSubmit() {
    if (!canAfford) {
      setError('포인트가 부족해요.')
      return
    }
    const ok = askQuestion(subjectId, title, body)
    if (!ok) {
      setError('제목과 내용을 입력해주세요.')
      return
    }
    onDone()
  }

  return (
    <div className="w-full max-w-sm bg-white/80 rounded-2xl shadow px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-cute text-ink">질문하기</span>
        <span className="font-pixel text-xs text-ink-soft">
          비용 {ASK_QUESTION_COST}P · 보유 {balance}P
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubjectId(s.id)}
            className={`font-cute px-3 py-1 rounded-full border text-xs ${
              subjectId === s.id ? 'border-ink text-ink' : 'border-ink/15 text-ink-soft'
            }`}
            style={{ backgroundColor: subjectId === s.id ? s.color : 'white' }}
          >
            {s.name}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="질문 제목"
        className="font-cute text-sm px-3 py-2 rounded-xl border border-ink/15 outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="궁금한 내용을 자세히 적어주세요"
        rows={3}
        className="font-cute text-sm px-3 py-2 rounded-xl border border-ink/15 outline-none resize-none"
      />

      {error && <p className="text-red-400 text-xs font-cute">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="font-cute flex-1 px-4 py-2 rounded-full border border-ink/20 text-ink-soft text-sm"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canAfford}
          className="font-cute flex-1 px-4 py-2 rounded-full bg-pastel-yellow text-ink text-sm disabled:opacity-50"
        >
          등록하기
        </button>
      </div>
    </div>
  )
}
