import { useState } from 'react'
import { QuestionBoard } from './QuestionBoard'
import { MentorList } from '../mentor/MentorList'

type Tab = 'board' | 'mentor'

export function QnaPage() {
  const [tab, setTab] = useState<Tab>('board')

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">지식인 💡</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('board')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            tab === 'board' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          질문게시판
        </button>
        <button
          type="button"
          onClick={() => setTab('mentor')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            tab === 'mentor' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          멘토
        </button>
      </div>

      {tab === 'board' ? <QuestionBoard /> : <MentorList />}
    </div>
  )
}
