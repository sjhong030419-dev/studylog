import { describe, expect, it } from 'vitest'
import {
  activeSubjectsOf,
  canStartWithSubject,
  computeAddSubject,
  computeRemoveSubject,
  computeUpdateSubjectColor,
  computeUpdateSubjectName,
} from './subjectMath'
import type { Subject } from '../types'

function subject(partial: Partial<Subject> & Pick<Subject, 'id' | 'name'>): Subject {
  return { color: '#ffb3c6', ...partial }
}

describe('new users start with no default subjects (docs: no auto-created 국어/수학/영어)', () => {
  it('an empty subject list has no active subjects', () => {
    expect(activeSubjectsOf([])).toEqual([])
  })
})

describe('computeAddSubject', () => {
  it('adds the first subject', () => {
    const result = computeAddSubject([], '토익')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.subjects).toHaveLength(1)
      expect(result.newSubject.name).toBe('토익')
      expect(result.newSubject.id).toBeTruthy()
    }
  })

  it('rejects a blank name', () => {
    expect(computeAddSubject([], '   ').ok).toBe(false)
  })

  it('rejects a duplicate name', () => {
    const existing = [subject({ id: '1', name: '코딩' })]
    expect(computeAddSubject(existing, '코딩').ok).toBe(false)
  })

  it('rejects a duplicate name that differs only by case', () => {
    const existing = [subject({ id: '1', name: 'TOEIC' })]
    expect(computeAddSubject(existing, 'toeic').ok).toBe(false)
  })

  it('assigns a color and does not require a specific existing subject count', () => {
    const result = computeAddSubject([subject({ id: '1', name: '독서' })], '면접 준비')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.newSubject.color).toBeTruthy()
  })
})

describe('computeUpdateSubjectName', () => {
  it('renames a subject', () => {
    const subjects = [subject({ id: '1', name: '자격증' })]
    const result = computeUpdateSubjectName(subjects, '1', '정보처리기사')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.subjects[0].name).toBe('정보처리기사')
  })

  it('rejects a blank name', () => {
    const subjects = [subject({ id: '1', name: '자격증' })]
    expect(computeUpdateSubjectName(subjects, '1', '  ').ok).toBe(false)
  })

  it('rejects renaming to a name that collides with another subject', () => {
    const subjects = [subject({ id: '1', name: '토익' }), subject({ id: '2', name: '토플' })]
    expect(computeUpdateSubjectName(subjects, '2', '토익').ok).toBe(false)
  })

  it('allows renaming a subject to its own current name', () => {
    const subjects = [subject({ id: '1', name: '토익' })]
    expect(computeUpdateSubjectName(subjects, '1', '토익').ok).toBe(true)
  })
})

describe('computeUpdateSubjectColor', () => {
  it('changes the color', () => {
    const subjects = [subject({ id: '1', name: '독서', color: '#ffb3c6' })]
    const result = computeUpdateSubjectColor(subjects, '1', '#a8d8ff')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.subjects[0].color).toBe('#a8d8ff')
  })
})

describe('computeRemoveSubject (always archives — never hard-deletes)', () => {
  it('never removes a subject from the array, even one with zero study history', () => {
    // Regression: this used to hard-delete a history-less subject, which
    // silently lost its name/color for any planner task, AI tutor message,
    // or other data that referenced it by id without ever having a study
    // session. Archiving unconditionally means those references can always
    // resolve a real name (docs: data-preservation review finding).
    const subjects = [subject({ id: '1', name: '코딩' })]
    const result = computeRemoveSubject(subjects, '1', '1', false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.subjects).toHaveLength(1)
      expect(result.subjects.some((s) => s.id === '1')).toBe(true)
    }
  })

  it('always sets archivedAt', () => {
    const subjects = [subject({ id: '1', name: '코딩' })]
    const result = computeRemoveSubject(subjects, '1', '1', false)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.subjects[0].archivedAt).toBeTypeOf('number')
  })

  it('preserves the name and color of an archived subject', () => {
    const subjects = [subject({ id: '1', name: '코딩', color: '#a8d8ff' })]
    const result = computeRemoveSubject(subjects, '1', '1', false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.subjects[0].name).toBe('코딩')
      expect(result.subjects[0].color).toBe('#a8d8ff')
    }
  })

  it('hides the archived subject from activeSubjectsOf (selection lists)', () => {
    const subjects = [subject({ id: '1', name: '코딩' })]
    const result = computeRemoveSubject(subjects, '1', '1', false)
    expect(result.ok).toBe(true)
    if (result.ok) expect(activeSubjectsOf(result.subjects)).toHaveLength(0)
  })

  it('reassigns selection to the first remaining active subject when the selected one is archived', () => {
    const subjects = [subject({ id: '1', name: '코딩' }), subject({ id: '2', name: '독서' })]
    const result = computeRemoveSubject(subjects, '1', '1', false)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.selectedSubjectId).toBe('2')
  })

  it('sets selection to null when archiving the last remaining active subject', () => {
    const subjects = [subject({ id: '1', name: '코딩' })]
    const result = computeRemoveSubject(subjects, '1', '1', false)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.selectedSubjectId).toBeNull()
  })

  it('refuses to archive the subject the timer is actively running on', () => {
    const subjects = [subject({ id: '1', name: '코딩' })]
    const result = computeRemoveSubject(subjects, '1', '1', true)
    expect(result.ok).toBe(false)
  })

  it('allows archiving a different subject while the timer runs on another one', () => {
    const subjects = [subject({ id: '1', name: '코딩' }), subject({ id: '2', name: '독서' })]
    const result = computeRemoveSubject(subjects, '2', '1', true)
    expect(result.ok).toBe(true)
  })

  it('does not touch other subjects or the current selection when they are unrelated', () => {
    const subjects = [subject({ id: '1', name: '코딩' }), subject({ id: '2', name: '독서' })]
    const result = computeRemoveSubject(subjects, '1', '2', false)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const kept = result.subjects.find((s) => s.id === '2')
      expect(kept?.archivedAt).toBeUndefined()
      expect(result.selectedSubjectId).toBe('2') // untouched, wasn't the removed one
    }
  })

  it('rejects removing an id that does not exist', () => {
    const subjects = [subject({ id: '1', name: '코딩' })]
    const result = computeRemoveSubject(subjects, 'missing', null, false)
    expect(result.ok).toBe(false)
  })
})

describe('canStartWithSubject (blocks starting the timer/Pomodoro without a real subject)', () => {
  it('blocks starting when nothing is selected', () => {
    expect(canStartWithSubject(null)).toBe(false)
  })

  it('blocks starting with an empty-string subject id', () => {
    expect(canStartWithSubject('')).toBe(false)
  })

  it('allows starting once a real subject is selected', () => {
    expect(canStartWithSubject('subject-1')).toBe(true)
  })
})

describe('activeSubjectsOf', () => {
  it('excludes archived subjects from selection lists', () => {
    const subjects = [
      subject({ id: '1', name: '코딩' }),
      subject({ id: '2', name: '독서', archivedAt: Date.now() }),
    ]
    const active = activeSubjectsOf(subjects)
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('1')
  })
})
