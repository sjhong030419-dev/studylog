import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey } from '../utils/time'

interface AwayState {
  awayByDate: Record<string, number>
  logAway: (dateKey: string, sec: number) => void
  todayAwaySec: () => number
  awaySecOn: (dateKey: string) => number
}

export const useAwayStore = create<AwayState>()(
  persist(
    (set, get) => ({
      awayByDate: {},

      logAway: (dateKey, sec) => {
        if (sec <= 0) return
        set({
          awayByDate: {
            ...get().awayByDate,
            [dateKey]: (get().awayByDate[dateKey] ?? 0) + sec,
          },
        })
      },

      todayAwaySec: () => get().awayByDate[todayKey()] ?? 0,
      awaySecOn: (dateKey) => get().awayByDate[dateKey] ?? 0,
    }),
    { name: 'studylog-away' },
  ),
)
