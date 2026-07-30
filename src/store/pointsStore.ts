import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointTransaction } from '../types'
import { todayKey } from '../utils/time'
import {
  computeBalance,
  computeStudyXpTotal,
  computeStudyXpTotalBeforeLastSession,
  computeTodayEarnedFromStudy,
} from './pointsMath'

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
  /** Study XP — lifetime points earned specifically from study sessions
   * (`earn_study` transactions only). This is the sole source for character
   * level/room growth: it excludes ad bonuses, streak bonuses, and any
   * other non-study reward, and it never decreases when points are spent.
   * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §8) */
  studyXpTotal: () => number
  /** Study XP total as of just before the most recently earned study
   * session — used to show "level before -> after" on the result/capture
   * card (PRD §14). Never a fabricated value: it's the same transaction
   * log minus the latest `earn_study` entry. */
  studyXpTotalBeforeLastSession: () => number
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

      balance: () => computeBalance(get().transactions),

      studyXpTotal: () => computeStudyXpTotal(get().transactions),

      studyXpTotalBeforeLastSession: () => computeStudyXpTotalBeforeLastSession(get().transactions),

      todayEarnedFromStudy: () => computeTodayEarnedFromStudy(get().transactions, todayKey()),

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
