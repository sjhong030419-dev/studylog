import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointTransaction } from '../types'
import { todayKey } from '../utils/time'

export const POINTS_PER_10_MIN = 1
export const DAILY_STUDY_POINT_CAP = 60
export const STREAK_MILESTONES: Record<number, number> = {
  3: 5,
  7: 15,
  14: 30,
  30: 60,
  100: 200,
}

function yesterdayKeyOf(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() - 1)
  return todayKey(date)
}

interface PointsState {
  transactions: PointTransaction[]
  streakCount: number
  lastStudyDate: string | null
  milestonesAwarded: number[]
  school: string | null

  balance: () => number
  todayEarnedFromStudy: () => number
  earnFromStudySession: (durationSec: number) => void
  earn: (amount: number, reason: string) => void
  spend: (amount: number, reason: string) => boolean
  setSchool: (name: string) => void
}

export const usePointsStore = create<PointsState>()(
  persist(
    (set, get) => ({
      transactions: [],
      streakCount: 0,
      lastStudyDate: null,
      milestonesAwarded: [],
      school: null,

      balance: () => {
        return get().transactions.reduce(
          (sum, t) => sum + (t.type === 'spend' ? -t.amount : t.amount),
          0,
        )
      },

      todayEarnedFromStudy: () => {
        const key = todayKey()
        return get()
          .transactions.filter((t) => t.dateKey === key && t.type === 'earn_study')
          .reduce((sum, t) => sum + t.amount, 0)
      },

      earnFromStudySession: (durationSec) => {
        const key = todayKey()
        const state = get()
        const raw = Math.floor(durationSec / 600) * POINTS_PER_10_MIN
        const alreadyToday = state.todayEarnedFromStudy()
        const awardable = Math.max(0, Math.min(raw, DAILY_STUDY_POINT_CAP - alreadyToday))

        const newTransactions: PointTransaction[] = [...state.transactions]

        if (awardable > 0) {
          newTransactions.push({
            id: `pt-study-${Date.now()}`,
            type: 'earn_study',
            amount: awardable,
            reason: '공부 시간 적립',
            dateKey: key,
            timestamp: Date.now(),
          })
        }

        let { streakCount, lastStudyDate, milestonesAwarded } = state

        if (lastStudyDate !== key) {
          streakCount = lastStudyDate === yesterdayKeyOf(key) ? streakCount + 1 : 1
          lastStudyDate = key

          const bonus = STREAK_MILESTONES[streakCount]
          if (bonus && !milestonesAwarded.includes(streakCount)) {
            newTransactions.push({
              id: `pt-streak-${Date.now()}`,
              type: 'earn_streak',
              amount: bonus,
              reason: `${streakCount}일 연속 출석 보너스`,
              dateKey: key,
              timestamp: Date.now(),
            })
            milestonesAwarded = [...milestonesAwarded, streakCount]
          }
        }

        set({ transactions: newTransactions, streakCount, lastStudyDate, milestonesAwarded })
      },

      earn: (amount, reason) => {
        if (amount <= 0) return
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              id: `pt-earn-${Date.now()}`,
              type: 'earn_other',
              amount,
              reason,
              dateKey: todayKey(),
              timestamp: Date.now(),
            },
          ],
        }))
      },

      spend: (amount, reason) => {
        if (get().balance() < amount) return false
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              id: `pt-spend-${Date.now()}`,
              type: 'spend',
              amount,
              reason,
              dateKey: todayKey(),
              timestamp: Date.now(),
            },
          ],
        }))
        return true
      },

      setSchool: (name) => set({ school: name.trim() || null }),
    }),
    { name: 'studylog-points' },
  ),
)
