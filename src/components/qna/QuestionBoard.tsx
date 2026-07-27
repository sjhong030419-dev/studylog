import { useState } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { useQnaStore } from '../../store/qnaStore'
import { AskQuestionForm } from './AskQuestionForm'
import { QuestionDetail } from './QuestionDetail'

type View = 'list' | 'ask' | 'detail'

export function QuestionBoard() {
  const subjects = useTimerStore((s) => s.subjects)
  const questions = useQnaStore((s) => s.questions)

  const [view, setView] = useState<View>('list')
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (view === 'ask') {
    return <AskQuestionForm onDone={() => setView('list')} onCancel={() => setView('list')} />
  }

  if (view === 'detail' && selectedId) {
    const question = questions.find((q) => q.id === selectedId)
    if (question) {
      return <QuestionDetail question={question} onBack={() => setView('list')} />
    }
  }

  const filtered = subjectFilter ? questions.filter((q) => q.subjectId === subjectFilter) : questions
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSubjectFilter(null)}
            className={`font-cute px-2.5 py-1 rounded-full border text-xs ${
              subjectFilter === null ? 'border-ink text-ink' : 'border-ink/15 text-ink-soft'
            }`}
          >
            전체
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubjectFilter(s.id)}
              className={`font-cute px-2.5 py-1 rounded-full border text-xs ${
                subjectFilter === s.id ? 'border-ink text-ink' : 'border-ink/15 text-ink-soft'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView('ask')}
          className="font-cute text-xs px-3 py-1.5 rounded-full bg-pastel-yellow text-ink shrink-0"
        >
          + 질문하기
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="text-ink-soft text-sm text-center font-cute py-6">아직 질문이 없어요.</p>
        )}
        {sorted.map((q) => {
          const subject = subjects.find((s) => s.id === q.subjectId)
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setSelectedId(q.id)
                setView('detail')
              }}
              className="text-left bg-white/70 rounded-2xl px-4 py-3 shadow-sm flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                {subject && (
                  <span
                    className="font-cute text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  >
                    {subject.name}
                  </span>
                )}
                {q.acceptedAnswerId && (
                  <span className="text-[10px] font-cute px-2 py-0.5 rounded-full bg-pastel-mint text-ink">
                    해결됨
                  </span>
                )}
              </div>
              <p className="font-cute text-ink text-sm">{q.title}</p>
              <p className="text-ink-soft text-xs">
                {q.authorName} · 답변 {q.answers.length}개
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
