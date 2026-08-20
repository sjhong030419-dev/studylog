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
    <div className="w-full max-w-sm rounded-[22px] border border-white/80 bg-white/75 px-5 py-5 shadow-[0_8px_24px_rgba(108,82,130,0.08)] flex flex-col items-center gap-2.5 text-center backdrop-blur">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-(--color-home-soft-yellow) text-xl" aria-hidden="true">📚</span>
      {reason && <p className="font-cute text-ink-soft text-xs">{reason}</p>}
      <p className="font-cute text-ink text-sm">
        첫 공부 과목을 만들어볼까요?
        <br />
        이름은 나중에 언제든 바꾸거나 삭제할 수 있어요.
      </p>

      {!creating && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="font-cute min-h-[42px] rounded-full bg-(--color-home-accent-primary) px-6 py-2.5 text-sm text-white shadow-md"
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
