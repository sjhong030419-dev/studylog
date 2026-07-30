import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudySession, Subject } from '../types'
import { todayKey } from '../utils/time'
import { usePointsStore } from './pointsStore'
import { useAudioStore } from './audioStore'

const SUBJECT_COLORS = [
  '#ffb3c6',
  '#a8d8ff',
  '#c9f5e0',
  '#ffe29a',
  '#d3c2ff',
  '#ffcba4',
]

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'kor', name: '국어', color: SUBJECT_COLORS[0] },
  { id: 'math', name: '수학', color: SUBJECT_COLORS[1] },
  { id: 'eng', name: '영어', color: SUBJECT_COLORS[2] },
]

interface TimerState {
  subjects: Subject[]
  selectedSubjectId: string
  isRunning: boolean
  isPaused: boolean
  elapsedSec: number
  sessions: StudySession[]

  selectSubject: (id: string) => void
  addSubject: (name: string) => void
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
      subjects: DEFAULT_SUBJECTS,
      selectedSubjectId: DEFAULT_SUBJECTS[0].id,
      isRunning: false,
      isPaused: false,
      elapsedSec: 0,
      sessions: [],

      selectSubject: (id) => {
        if (get().isRunning) return
        set({ selectedSubjectId: id })
      },

      addSubject: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        const { subjects } = get()
        const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]
        const newSubject: Subject = {
          id: `custom-${Date.now()}`,
          name: trimmed,
          color,
        }
        set({ subjects: [...subjects, newSubject], selectedSubjectId: newSubject.id })
      },

      start: () => {
        if (get().isRunning) return
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
        if (elapsedSec > 0) {
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
      }),
    },
  ),
)

export function todaySessions(sessions: StudySession[]): StudySession[] {
  const key = todayKey()
  return sessions.filter((s) => s.dateKey === key)
}
