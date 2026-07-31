import type { Subject } from '../types'
import { generateId } from '../utils/id'

/** Kept generous — real subject names ("정보처리기사 실기 준비") can run
 * longer than the previous 10-char UI limit that only ever had to fit
 * "국어"/"수학"/"영어". */
export const SUBJECT_NAME_MAX_LENGTH = 20

export const SUBJECT_COLORS = ['#ffb3c6', '#a8d8ff', '#c9f5e0', '#ffe29a', '#d3c2ff', '#ffcba4']

export type SubjectMutationResult =
  | { ok: true; subjects: Subject[] }
  | { ok: false; error: string }

/** A study session (normal timer or Pomodoro) may only start once a real
 * subject is selected — never against no subject (empty `subjectId`). */
export function canStartWithSubject(selectedSubjectId: string | null): boolean {
  return Boolean(selectedSubjectId)
}

/** Subjects hidden from every "pick a subject" list — archived (has real
 * history, kept only so past records can resolve a real name) subjects
 * never show up as selectable, only in read paths that already have the
 * subject id from a saved record. */
export function activeSubjectsOf(subjects: Subject[]): Subject[] {
  return subjects.filter((s) => !s.archivedAt)
}

function isDuplicateName(subjects: Subject[], name: string, excludeId?: string): boolean {
  const normalized = name.trim().toLowerCase()
  return subjects.some((s) => s.id !== excludeId && !s.archivedAt && s.name.trim().toLowerCase() === normalized)
}

export function computeAddSubject(
  subjects: Subject[],
  rawName: string,
): { ok: true; subjects: Subject[]; newSubject: Subject } | { ok: false; error: string } {
  const name = rawName.trim()
  if (!name) return { ok: false, error: '과목 이름을 입력해주세요.' }
  if (name.length > SUBJECT_NAME_MAX_LENGTH) {
    return { ok: false, error: `과목 이름은 ${SUBJECT_NAME_MAX_LENGTH}자 이하로 입력해주세요.` }
  }
  if (isDuplicateName(subjects, name)) {
    return { ok: false, error: '이미 같은 이름의 과목이 있어요.' }
  }

  const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]
  const newSubject: Subject = { id: generateId('subject'), name, color }
  return { ok: true, subjects: [...subjects, newSubject], newSubject }
}

export function computeUpdateSubjectName(subjects: Subject[], id: string, rawName: string): SubjectMutationResult {
  const name = rawName.trim()
  if (!name) return { ok: false, error: '과목 이름을 입력해주세요.' }
  if (name.length > SUBJECT_NAME_MAX_LENGTH) {
    return { ok: false, error: `과목 이름은 ${SUBJECT_NAME_MAX_LENGTH}자 이하로 입력해주세요.` }
  }
  if (!subjects.some((s) => s.id === id)) return { ok: false, error: '존재하지 않는 과목이에요.' }
  if (isDuplicateName(subjects, name, id)) {
    return { ok: false, error: '이미 같은 이름의 과목이 있어요.' }
  }
  return { ok: true, subjects: subjects.map((s) => (s.id === id ? { ...s, name } : s)) }
}

export function computeUpdateSubjectColor(subjects: Subject[], id: string, color: string): SubjectMutationResult {
  if (!subjects.some((s) => s.id === id)) return { ok: false, error: '존재하지 않는 과목이에요.' }
  return { ok: true, subjects: subjects.map((s) => (s.id === id ? { ...s, color } : s)) }
}

export interface RemoveSubjectResult {
  ok: true
  subjects: Subject[]
  selectedSubjectId: string | null
}

/**
 * Removing a subject always archives it — it is never dropped from the
 * `subjects` array and `archivedAt` is always set. A study-session check
 * used to decide between archive and hard-delete, but that missed any
 * subject with planner tasks, AI tutor messages, or other data referencing
 * it by id but with zero sessions: hard-deleting those silently lost the
 * subject's name/color for every one of those other records. Archiving
 * unconditionally means every reference (sessions, planner, tutor
 * messages, stats, past result cards) can always resolve a real name.
 */
export function computeRemoveSubject(
  subjects: Subject[],
  id: string,
  selectedSubjectId: string | null,
  isTimerRunning: boolean,
): RemoveSubjectResult | { ok: false; error: string } {
  const target = subjects.find((s) => s.id === id)
  if (!target) return { ok: false, error: '존재하지 않는 과목이에요.' }
  if (isTimerRunning && selectedSubjectId === id) {
    return { ok: false, error: '타이머가 실행 중인 과목은 보관할 수 없어요. 먼저 타이머를 종료해주세요.' }
  }

  const nextSubjects = subjects.map((s) => (s.id === id ? { ...s, archivedAt: Date.now() } : s))

  let nextSelectedSubjectId = selectedSubjectId
  if (selectedSubjectId === id) {
    const remaining = activeSubjectsOf(nextSubjects)
    nextSelectedSubjectId = remaining[0]?.id ?? null
  }

  return { ok: true, subjects: nextSubjects, selectedSubjectId: nextSelectedSubjectId }
}
