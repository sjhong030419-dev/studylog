import { useState } from 'react'

interface SubjectEmptyStateProps {
  onAdd: (name: string) => { ok: true } | { ok: false; error: string }
  /** Short context line shown above the standard message — e.g. why this
   * particular screen is blocked. Optional. */
  reason?: string
}

/** Shared empty state for every screen that needs at least one real subject
 * before it can do anything (timer, pomodoro, planner, AI tutor, onboarding).
 * Never a blank/broken picker — always an honest explanation plus an
 * immediate way to fix it, right where the user already is. */
export function SubjectEmptyState({ onAdd, reason }: SubjectEmptyStateProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    const result = onAdd(name)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setName('')
    setCreating(false)
    setError(null)
  }

  return (
    <div className="w-full max-w-sm bg-white/70 rounded-2xl px-6 py-8 flex flex-col items-center gap-3 text-center">
      <span className="text-3xl" aria-hidden="true">
        📚
      </span>
      {reason && <p className="font-cute text-ink-soft text-xs">{reason}</p>}
      <p className="font-cute text-ink text-sm">
        아직 과목이 없어요.
        <br />
        먼저 공부할 과목을 추가해주세요.
      </p>

      {!creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="font-cute px-6 py-2.5 rounded-full bg-pastel-yellow text-ink shadow-md text-sm min-h-[40px]"
        >
          + 첫 과목 만들기
        </button>
      )}

      {creating && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-1.5 w-full justify-center">
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="예: 토익, 코딩, 자격증"
              maxLength={20}
              className="font-cute px-4 py-2 rounded-full border border-ink/30 text-sm outline-none w-40"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="font-cute px-4 py-2 rounded-full bg-ink text-white text-sm min-h-[40px]"
            >
              만들기
            </button>
          </div>
          {error && (
            <p role="alert" className="font-cute text-xs text-red-500">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
