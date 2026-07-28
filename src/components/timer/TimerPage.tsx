import { useState } from 'react'
import { StudyTimer } from './StudyTimer'
import { PomodoroTimer } from './PomodoroTimer'

type Mode = 'normal' | 'pomodoro'

export function TimerPage() {
  const [mode, setMode] = useState<Mode>('normal')

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">스터디로그 📖</h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('normal')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            mode === 'normal' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          일반 타이머
        </button>
        <button
          type="button"
          onClick={() => setMode('pomodoro')}
          className={`font-cute px-4 py-1.5 rounded-full border text-sm ${
            mode === 'pomodoro' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
          }`}
        >
          🍅 뽀모도로
        </button>
      </div>

      {mode === 'normal' ? <StudyTimer /> : <PomodoroTimer />}
    </div>
  )
}
