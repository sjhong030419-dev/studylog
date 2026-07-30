import { useEffect, useState } from 'react'
import { useTimerStore } from '../../store/timerStore'
import { activeSubjectsOf, SUBJECT_COLORS } from '../../store/subjectMath'
import type { Subject } from '../../types'

interface SubjectManagerPageProps {
  onBack: () => void
}

export function SubjectManagerPage({ onBack }: SubjectManagerPageProps) {
  const subjects = useTimerStore((s) => s.subjects)
  const sessions = useTimerStore((s) => s.sessions)
  const selectedSubjectId = useTimerStore((s) => s.selectedSubjectId)
  const isRunning = useTimerStore((s) => s.isRunning)
  const addSubject = useTimerStore((s) => s.addSubject)
  const updateSubjectName = useTimerStore((s) => s.updateSubjectName)
  const updateSubjectColor = useTimerStore((s) => s.updateSubjectColor)
  const removeSubject = useTimerStore((s) => s.removeSubject)

  const activeSubjects = activeSubjectsOf(subjects)
  const archivedSubjects = subjects.filter((s) => s.archivedAt)

  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast])

  function hasHistory(id: string): boolean {
    return sessions.some((s) => s.subjectId === id)
  }

  function handleAdd() {
    const result = addSubject(newName)
    if (!result.ok) {
      setAddError(result.error)
      return
    }
    setNewName('')
    setAddError(null)
  }

  function startEdit(subject: Subject) {
    setEditingId(subject.id)
    setEditingName(subject.name)
    setEditError(null)
  }

  function commitEdit() {
    if (!editingId) return
    const result = updateSubjectName(editingId, editingName)
    if (!result.ok) {
      setEditError(result.error)
      return
    }
    setEditingId(null)
    setEditError(null)
  }

  function confirmDelete(id: string) {
    const result = removeSubject(id)
    if (!result.ok) {
      setToast(result.error)
      setConfirmDeleteId(null)
      return
    }
    setToast(result.archived ? '과목을 보관했어요. 지난 기록은 계속 보여요.' : '과목을 삭제했어요.')
    setConfirmDeleteId(null)
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-10">
      <div className="w-full max-w-sm flex items-center gap-3">
        <button type="button" onClick={onBack} className="font-cute text-ink-soft text-sm">
          ← 뒤로
        </button>
        <h1 className="font-cute text-2xl text-ink">과목 관리 📚</h1>
      </div>

      <div className="w-full max-w-sm bg-white/70 backdrop-blur rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-3">
        <span className="font-cute text-ink-soft text-sm">새 과목 추가</span>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value.slice(0, 20))
              setAddError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="예: 토익, 코딩, 자격증"
            maxLength={20}
            className="flex-1 font-cute text-sm px-4 py-2.5 rounded-full border border-ink/20 outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="font-cute text-sm px-4 py-2.5 rounded-full bg-ink text-white shrink-0 min-h-[40px]"
          >
            추가
          </button>
        </div>
        {addError && (
          <p role="alert" className="font-cute text-xs text-red-500">
            {addError}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <span className="font-cute text-ink-soft text-sm px-1">내 과목</span>
        {activeSubjects.length === 0 && (
          <p className="font-cute text-ink-soft text-sm text-center py-6 bg-white/70 rounded-2xl">
            아직 과목이 없어요.
          </p>
        )}
        {activeSubjects.map((subject) => (
          <div key={subject.id} className="w-full bg-white/70 rounded-2xl px-4 py-3 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-ink/10"
                style={{ backgroundColor: subject.color }}
                aria-hidden="true"
              />
              {editingId === subject.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => {
                    setEditingName(e.target.value.slice(0, 20))
                    setEditError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  maxLength={20}
                  className="flex-1 font-cute text-sm px-3 py-1.5 rounded-full border border-ink/20 outline-none"
                />
              ) : (
                <span className="flex-1 font-cute text-sm text-ink">
                  {subject.name}
                  {selectedSubjectId === subject.id && (
                    <span className="ml-1.5 font-cute text-[10px] text-ink-soft">(선택됨)</span>
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateSubjectColor(subject.id, color)}
                  aria-label={`색상 선택 ${color}`}
                  className={`w-6 h-6 rounded-full border-2 ${
                    subject.color === color ? 'border-ink' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {editingId === subject.id ? (
                <>
                  <button
                    type="button"
                    onClick={commitEdit}
                    className="font-cute text-xs px-3 py-1.5 rounded-full bg-ink text-white min-h-[36px]"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setEditError(null)
                    }}
                    className="font-cute text-xs px-3 py-1.5 rounded-full border border-ink/20 text-ink-soft min-h-[36px]"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(subject)}
                  className="font-cute text-xs px-3 py-1.5 rounded-full border border-ink/20 text-ink-soft min-h-[36px]"
                >
                  이름 수정
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmDeleteId(subject.id)}
                disabled={isRunning && selectedSubjectId === subject.id}
                className="font-cute text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-500 min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              >
                삭제
              </button>
            </div>
            {editError && editingId === subject.id && (
              <p role="alert" className="font-cute text-xs text-red-500">
                {editError}
              </p>
            )}
            {isRunning && selectedSubjectId === subject.id && (
              <p className="font-cute text-[11px] text-ink-soft">타이머 작동 중에는 삭제할 수 없어요.</p>
            )}
          </div>
        ))}
      </div>

      {archivedSubjects.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          <span className="font-cute text-ink-soft text-sm px-1">보관된 과목 (기록 보존)</span>
          {archivedSubjects.map((subject) => (
            <div
              key={subject.id}
              className="w-full bg-white/40 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2"
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-ink/10 opacity-50"
                style={{ backgroundColor: subject.color }}
                aria-hidden="true"
              />
              <span className="flex-1 font-cute text-sm text-ink-soft">{subject.name}</span>
              <span className="font-cute text-[10px] text-ink-soft">선택 목록에서 숨김</span>
            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-6"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-cute text-ink text-lg">과목을 삭제할까요?</span>
            <p className="text-ink-soft text-sm font-cute">
              {hasHistory(confirmDeleteId)
                ? '이 과목에는 공부 기록이 있어요. 기록은 그대로 보존되고, 과목만 선택 목록에서 보이지 않게 보관돼요.'
                : '이 과목에는 아직 기록이 없어요. 완전히 삭제돼요.'}
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 font-cute text-sm px-4 py-2.5 rounded-full border border-ink/20 text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(confirmDeleteId)}
                className="flex-1 font-cute text-sm px-4 py-2.5 rounded-full bg-red-400 text-white"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-white font-cute text-xs px-4 py-2.5 rounded-full shadow-lg z-40">
          {toast}
        </div>
      )}
    </div>
  )
}
