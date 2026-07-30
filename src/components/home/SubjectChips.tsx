import { useState } from 'react'
import type { Subject } from '../../types'

interface SubjectChipsProps {
  subjects: Subject[]
  selectedSubjectId: string
  disabled: boolean
  onSelect: (id: string) => void
  onAdd: (name: string) => void
}

/** Preserves the exact existing subject selection and add-subject flow. */
export function SubjectChips({ subjects, selectedSubjectId, disabled, onSelect, onAdd }: SubjectChipsProps) {
  const [addingSubject, setAddingSubject] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')

  function handleAddSubject() {
    onAdd(newSubjectName)
    setNewSubjectName('')
    setAddingSubject(false)
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-sm">
      {subjects.map((subject) => (
        <button
          key={subject.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(subject.id)}
          className={`font-cute px-3 py-1.5 rounded-full border text-sm transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] ${
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
          className="font-cute px-3 py-1.5 rounded-full border border-dashed border-ink/30 text-sm text-ink-soft disabled:opacity-50 min-h-[36px]"
        >
          + 과목 추가
        </button>
      )}

      {addingSubject && (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            placeholder="과목 이름"
            className="font-cute px-3 py-1.5 rounded-full border border-ink/30 text-sm outline-none w-24"
          />
          <button
            type="button"
            onClick={handleAddSubject}
            className="font-cute px-2 py-1.5 rounded-full bg-ink text-white text-sm min-h-[36px]"
          >
            확인
          </button>
        </div>
      )}
    </div>
  )
}
