import { useState } from 'react'
import type { Subject } from '../../types'

interface SubjectChipsProps {
  subjects: Subject[]
  selectedSubjectId: string | null
  disabled: boolean
  onSelect: (id: string) => void
  onAdd: (name: string) => { ok: true } | { ok: false; error: string }
  compact?: boolean
}

/** Preserves the exact existing subject selection and add-subject flow. */
export function SubjectChips({ subjects, selectedSubjectId, disabled, onSelect, onAdd, compact = false }: SubjectChipsProps) {
  const [addingSubject, setAddingSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleAddSubject() {
    const result = onAdd(newSubjectName)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setNewSubjectName('')
    setAddingSubject(false)
    setError(null)
  }

  return (
    <div className={`flex max-w-full flex-col items-center gap-1.5 ${compact ? 'w-full' : 'max-w-sm'}`}>
      <div className={`flex max-w-full gap-2 ${compact ? 'w-full flex-nowrap justify-start overflow-x-auto overscroll-contain pb-1' : 'flex-wrap justify-center'}`}>
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(subject.id)}
            className={`shrink-0 rounded-full border font-cute transition disabled:cursor-not-allowed disabled:opacity-50 ${compact ? 'min-h-[34px] px-3 py-1 text-xs' : 'min-h-[44px] px-3 py-1.5 text-sm'} ${
              selectedSubjectId === subject.id
                ? 'border-ink text-ink'
                : 'border-ink/15 text-ink-soft hover:border-ink/40'
            }`}
            style={{
              backgroundColor: selectedSubjectId === subject.id ? subject.color : 'white',
            }}
          >
            {subject.name}
          </button>
        ))}

        {!addingSubject && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAddingSubject(true)}
            className={`shrink-0 rounded-full border border-dashed border-ink/30 font-cute text-ink-soft disabled:opacity-50 ${compact ? 'min-h-[34px] px-3 py-1 text-xs' : 'min-h-[44px] px-3 py-1.5 text-sm'}`}
          >
            + 과목 추가
          </button>
        )}

        {addingSubject && (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={newSubjectName}
              onChange={(e) => {
                setNewSubjectName(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="과목 이름"
              maxLength={20}
              className="font-cute px-3 py-1.5 rounded-full border border-ink/30 text-sm outline-none w-24"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="font-cute px-2 py-1.5 rounded-full bg-ink text-white text-sm min-h-[44px]"
            >
              확인
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="font-cute text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
