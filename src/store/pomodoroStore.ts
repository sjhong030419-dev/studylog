import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTimerStore } from './timerStore'
import { canStartWithSubject } from './subjectMath'
import { playChime } from '../utils/noiseSynth'
import { todayKey } from '../utils/time'

export type PomodoroPhase = 'idle' | 'focus' | 'break' | 'done'

interface PomodoroState {
  subjectId: string
  focusMin: number
  breakMin: number
  totalRounds: number
  currentRound: number
  phase: PomodoroPhase
  remainingSec: number
  isPaused: boolean
  roundsDateKey: string
  completedRoundsToday: number

  start: (subjectId: string, focusMin: number, breakMin: number, rounds: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  reset: () => void
  tick: () => void
}

function ensureFreshDay(get: () => PomodoroState, set: (partial: Partial<PomodoroState>) => void) {
  const key = todayKey()
  if (get().roundsDateKey !== key) {
    set({ roundsDateKey: key, completedRoundsToday: 0 })
  }
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      subjectId: '',
      focusMin: 25,
      breakMin: 5,
      totalRounds: 4,
      currentRound: 0,
      phase: 'idle',
      remainingSec: 0,
      isPaused: false,
      roundsDateKey: todayKey(),
      completedRoundsToday: 0,

      start: (subjectId, focusMin, breakMin, rounds) => {
        if (!canStartWithSubject(subjectId)) return
        ensureFreshDay(get, set)
        set({
          subjectId,
          focusMin,
          breakMin,
          totalRounds: Math.max(1, rounds),
          currentRound: 1,
          phase: 'focus',
          remainingSec: focusMin * 60,
          isPaused: false,
        })
      },

  pause: () => {
    if (get().phase === 'idle' || get().phase === 'done') return
    set({ isPaused: true })
  },

  resume: () => {
    if (get().phase === 'idle' || get().phase === 'done') return
    set({ isPaused: false })
  },

  stop: () => {
    const { phase, subjectId, focusMin, remainingSec } = get()
    if (phase === 'focus') {
      const elapsed = focusMin * 60 - remainingSec
      if (elapsed > 0) useTimerStore.getState().logSession(subjectId, elapsed)
    }
    set({ phase: 'idle', currentRound: 0, remainingSec: 0, isPaused: false })
  },

  reset: () => {
    set({ phase: 'idle', currentRound: 0, remainingSec: 0, isPaused: false })
  },

  tick: () => {
    const state = get()
    if (state.phase !== 'focus' && state.phase !== 'break') return
    if (state.isPaused) return

    if (state.remainingSec > 1) {
      set({ remainingSec: state.remainingSec - 1 })
      return
    }

    playChime()

    if (state.phase === 'focus') {
      useTimerStore.getState().logSession(state.subjectId, state.focusMin * 60)
      const completedRoundsToday = state.completedRoundsToday + 1

      if (state.currentRound >= state.totalRounds) {
        set({ phase: 'done', remainingSec: 0, completedRoundsToday })
      } else {
        set({ phase: 'break', remainingSec: state.breakMin * 60, completedRoundsToday })
      }
    } else {
      set({
        phase: 'focus',
        currentRound: state.currentRound + 1,
        remainingSec: state.focusMin * 60,
      })
    }
  },
    }),
    {
      name: 'studylog-pomodoro',
      partialize: (state) => ({
        roundsDateKey: state.roundsDateKey,
        completedRoundsToday: state.completedRoundsToday,
      }),
    },
  ),
)
