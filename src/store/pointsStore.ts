import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PointTransaction } from '../types'
import { todayKey } from '../utils/time'
import {
  computeAwardableStudyXp,
  computeBalance,
  computeStreakUpdate,
  computeStudyXpBeforeTodaysLastSession,
  computeStudyXpTotal,
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
  /** Study XP total as of just before TODAY's most recently earned study
   * session — undefined if no Study XP was earned today. Used to show
   * "level before -> after" on the result/capture card (PRD §14), scoped
   * to today so a past day's level change is never shown on today's card. */
  studyXpTotalBeforeTodaysLastSession: () => number | undefined
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

      studyXpTotalBeforeTodaysLastSession: () => computeStudyXpBeforeTodaysLastSession(get().transactions, todayKey()),

      todayEarnedFromStudy: () => computeTodayEarnedFromStudy(get().transactions, todayKey()),

      earnFromStudySession: (durationSec) => {
        const key = todayKey()
        const state = get()
        const alreadyToday = state.todayEarnedFromStudy()
        const awardable = computeAwardableStudyXp(durationSec, alreadyToday, DAILY_STUDY_POINT_CAP, POINTS_PER_10_MIN)

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

        // Attendance/streak only counts a day when this session actually
        // earned real Study XP — a sub-10-minute session, or a session
        // after the daily cap is already spent, must never start or bump
        // the streak (docs/StudyLog_XP_Level_Reward_Rules.md §6).
        const streakUpdate = computeStreakUpdate(
          { streakCount: state.streakCount, lastStudyDate: state.lastStudyDate, milestonesAwarded: state.milestonesAwarded },
          { awardable, todayDateKey: key, yesterdayDateKey: yesterdayKeyOf(key), milestones: STREAK_MILESTONES },
        )

        if (streakUpdate.milestoneBonus) {
          newTransactions.push({
            id: `pt-streak-${Date.now()}`,
            type: 'earn_streak',
            amount: streakUpdate.milestoneBonus.amount,
            reason: `${streakUpdate.milestoneBonus.streakCount}일 연속 출석 보너스`,
            dateKey: key,
            timestamp: Date.now(),
          })
        }

        set({
          transactions: newTransactions,
          streakCount: streakUpdate.streakCount,
          lastStudyDate: streakUpdate.lastStudyDate,
          milestonesAwarded: streakUpdate.milestonesAwarded,
        })
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
