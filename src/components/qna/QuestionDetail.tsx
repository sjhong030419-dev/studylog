import { useState } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { useQnaStore } from '../../store/qnaStore'
import type { Question } from '../../types'

function timeAgo(ts: number): string {
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  return `${Math.floor(diffHour / 24)}일 전`
}

interface QuestionDetailProps {
  question: Question
  onBack: () => void
}

export function QuestionDetail({ question, onBack }: QuestionDetailProps) {
  const subjects = useTimerStore((s) => s.subjects)
  const addAnswer = useQnaStore((s) => s.addAnswer)
  const acceptAnswer = useQnaStore((s) => s.acceptAnswer)
  const [answerBody, setAnswerBody] = useState('')

  const subject = subjects.find((s) => s.id === question.subjectId)
  const isMyQuestion = question.authorName === '나'

  function handleSubmitAnswer() {
    if (!answerBody.trim()) return
    addAnswer(question.id, answerBody)
    setAnswerBody('')
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      <button type="button" onClick={onBack} className="font-cute text-ink-soft text-sm self-start">
        ← 목록으로
      </button>

      <div className="bg-white/80 rounded-2xl shadow px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {subject && (
            <span
              className="font-cute text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: subject.color }}
            >
              {subject.name}
            </span>
          )}
          <span className="text-ink-soft text-xs">{question.authorName} · {timeAgo(question.createdAt)}</span>
        </div>
        <h2 className="font-cute text-ink text-lg">{question.title}</h2>
        <p className="text-ink text-sm whitespace-pre-wrap">{question.body}</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-cute text-ink-soft text-sm">답변 {question.answers.length}개</span>
        {question.answers.map((a) => {
          const isAccepted = question.acceptedAnswerId === a.id
          return (
            <div
              key={a.id}
              className={`rounded-2xl px-4 py-3 shadow-sm flex flex-col gap-1 ${
                isAccepted ? 'bg-pastel-mint' : 'bg-white/70'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-cute text-ink text-sm">{a.authorName}</span>
                {a.authorIsMentor && (
                  <span className="text-[10px] font-cute px-1.5 py-0.5 rounded-full bg-pastel-yellow text-ink">
                    멘토
                  </span>
                )}
                {isAccepted && (
                  <span className="text-[10px] font-cute px-1.5 py-0.5 rounded-full bg-ink text-white">
                    채택됨 ✓
                  </span>
                )}
                <span className="text-ink-soft text-xs ml-auto">{timeAgo(a.createdAt)}</span>
              </div>
              <p className="text-ink text-sm">{a.body}</p>
              {isMyQuestion && !question.acceptedAnswerId && (
                <button
                  type="button"
                  onClick={() => acceptAnswer(question.id, a.id)}
                  className="font-cute self-end text-xs px-3 py-1 rounded-full bg-ink text-white"
                >
                  이 답변 채택
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white/80 rounded-2xl shadow px-4 py-3 flex flex-col gap-2">
        <textarea
          value={answerBody}
          onChange={(e) => setAnswerBody(e.target.value)}
          placeholder="답변을 작성해보세요"
          rows={2}
          className="font-cute text-sm outline-none resize-none bg-transparent"
        />
        <button
          type="button"
          onClick={handleSubmitAnswer}
          className="font-cute self-end px-4 py-1.5 rounded-full bg-pastel-lavender text-ink text-sm"
        >
          답변 등록
        </button>
      </div>
    </div>
  )
}
