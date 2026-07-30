import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudySession, Subject } from '../types'
import { todayKey } from '../utils/time'
import { usePointsStore } from './pointsStore'
import { useAudioStore } from './audioStore'
import {
  activeSubjectsOf,
  canStartWithSubject,
  computeAddSubject,
  computeRemoveSubject,
  computeUpdateSubjectColor,
  computeUpdateSubjectName,
} from './subjectMath'

interface TimerState {
  subjects: Subject[]
  /** null = no subject selected yet — the only valid state for a brand-new
   * user with zero subjects (no auto-created defaults). */
  selectedSubjectId: string | null
  isRunning: boolean
  isPaused: boolean
  elapsedSec: number
  sessions: StudySession[]

  selectSubject: (id: string) => void
  addSubject: (name: string) => { ok: true } | { ok: false; error: string }
  updateSubjectName: (id: string, name: string) => { ok: true } | { ok: false; error: string }
  updateSubjectColor: (id: string, color: string) => { ok: true } | { ok: false; error: string }
  /** Archives the subject if it has real study history (keeps the record so
   * past sessions can still resolve a name), otherwise removes it outright.
   * Refuses while the timer is actively running on that subject. */
  removeSubject: (id: string) => { ok: true; archived: boolean } | { ok: false; error: string }
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  tick: () => void
  logSession: (subjectId: string, durationSec: number) => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      subjects: [],
      selectedSubjectId: null,
      isRunning: false,
      isPaused: false,
      elapsedSec: 0,
      sessions: [],

      selectSubject: (id) => {
        if (get().isRunning) return
        set({ selectedSubjectId: id })
      },

      addSubject: (name) => {
        const result = computeAddSubject(get().subjects, name)
        if (!result.ok) return { ok: false, error: result.error }
        set({ subjects: result.subjects, selectedSubjectId: result.newSubject.id })
        return { ok: true }
      },

      updateSubjectName: (id, name) => {
        const result = computeUpdateSubjectName(get().subjects, id, name)
        if (!result.ok) return result
        set({ subjects: result.subjects })
        return { ok: true }
      },

      updateSubjectColor: (id, color) => {
        const result = computeUpdateSubjectColor(get().subjects, id, color)
        if (!result.ok) return result
        set({ subjects: result.subjects })
        return { ok: true }
      },

      removeSubject: (id) => {
        const { subjects, sessions, selectedSubjectId, isRunning } = get()
        const result = computeRemoveSubject(subjects, sessions, id, selectedSubjectId, isRunning)
        if (!result.ok) return result
        set({ subjects: result.subjects, selectedSubjectId: result.selectedSubjectId })
        return { ok: true, archived: result.archived }
      },

      start: () => {
        if (get().isRunning) return
        if (!canStartWithSubject(get().selectedSubjectId)) return
        set({ isRunning: true, isPaused: false, elapsedSec: 0 })
      },

      pause: () => {
        if (!get().isRunning || get().isPaused) return
        set({ isPaused: true })
      },

      resume: () => {
        if (!get().isRunning || !get().isPaused) return
        set({ isPaused: false })
      },

      stop: () => {
        const { isRunning, elapsedSec, selectedSubjectId } = get()
        if (!isRunning) return
        // `start()` already refuses to run without a selected subject, so
        // this is only a defensive guard — never silently log a session
        // against no subject.
        if (elapsedSec > 0 && selectedSubjectId) {
          get().logSession(selectedSubjectId, elapsedSec)
        }
        set({ isRunning: false, isPaused: false, elapsedSec: 0 })
        useAudioStore.getState().stopAllIfAutoStop()
      },

      tick: () => {
        const { isRunning, isPaused, elapsedSec } = get()
        if (!isRunning || isPaused) return
        set({ elapsedSec: elapsedSec + 1 })
      },

      logSession: (subjectId, durationSec) => {
        if (durationSec <= 0) return
        const session: StudySession = {
          id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId,
          startedAt: Date.now() - durationSec * 1000,
          durationSec,
          dateKey: todayKey(),
        }
        set({ sessions: [...get().sessions, session] })
        usePointsStore.getState().earnFromStudySession(durationSec)
      },
    }),
    {
      name: 'studylog-timer',
      partialize: (state) => ({
        subjects: state.subjects,
        sessions: state.sessions,
        selectedSubjectId: state.selectedSubjectId,
      }),
      // Deliberately NOT using zustand's `migrate`/`version` here: it only
      // fires when the persisted JSON has a numeric `version` field
      // (zustand/esm/middleware.mjs checks
      // `typeof deserializedStorageValue.version === "number"` before ever
      // calling `migrate`). Every real existing user's `studylog-timer`
      // blob predates this field entirely, so `migrate` would silently
      // never run for them — confirmed by reproducing it live: with
      // `version` absent, the store hydrated with `selectedSubjectId`
      // still `null`/`undefined`, and clicking "시작" silently did nothing
      // (`canStartWithSubject` correctly refused it). `onRehydrateStorage`
      // runs unconditionally after every hydration regardless of a
      // `version` field, so it's used instead to backfill/repair
      // `selectedSubjectId` from the user's own real `subjects` — never
      // touches `subjects`/`sessions` themselves, so existing study
      // history is untouched.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const active = activeSubjectsOf(state.subjects)
        if (!state.selectedSubjectId || !active.some((s) => s.id === state.selectedSubjectId)) {
          state.selectedSubjectId = active[0]?.id ?? null
        }
      },
    },
  ),
)

export function todaySessions(sessions: StudySession[]): StudySession[] {
  const key = todayKey()
  return sessions.filter((s) => s.dateKey === key)
}
