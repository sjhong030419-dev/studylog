import type { PointTransaction } from '../types'

/** Pure reducers over the transaction log, extracted from `pointsStore` so
 * they're testable without a Zustand/localStorage-backed store instance. */

export function computeBalance(transactions: PointTransaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.type === 'spend' ? -t.amount : t.amount), 0)
}

/** Study XP — study-only lifetime earnings. Never includes ad/bonus/streak
 * rewards, never decreases on spend
 * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §8). */
export function computeStudyXpTotal(transactions: PointTransaction[]): number {
  return transactions.filter((t) => t.type === 'earn_study').reduce((sum, t) => sum + t.amount, 0)
}

export function computeTodayEarnedFromStudy(transactions: PointTransaction[], dateKey: string): number {
  return transactions
    .filter((t) => t.dateKey === dateKey && t.type === 'earn_study')
    .reduce((sum, t) => sum + t.amount, 0)
}

/** Study XP total as of just before TODAY's most recently earned study
 * transaction — undefined when no Study XP was earned today. Used to show
 * a same-day "level before -> after" transition on the capture card (PRD
 * §14): a level change from a past day must never be attributed to
 * today's card, so this is deliberately scoped to `todayDateKey` rather
 * than "the most recent transaction ever". */
export function computeStudyXpBeforeTodaysLastSession(
  transactions: PointTransaction[],
  todayDateKey: string,
): number | undefined {
  const todaysStudyTx = transactions
    .filter((t) => t.type === 'earn_study' && t.dateKey === todayDateKey)
    .sort((a, b) => a.timestamp - b.timestamp)
  if (todaysStudyTx.length === 0) return undefined
  const last = todaysStudyTx[todaysStudyTx.length - 1]
  return computeStudyXpTotal(transactions) - last.amount
}

/** Real Study XP a session actually earns — floored to whole 10-minute
 * blocks, then capped by whatever headroom remains under the daily cap. A
 * session under 10 minutes, or a session on a day that already hit the
 * cap, earns 0 — and 0 must never count as "studied today" for streak
 * purposes (docs/StudyLog_XP_Level_Reward_Rules.md §2-3, §6). */
export function computeAwardableStudyXp(
  durationSec: number,
  alreadyEarnedToday: number,
  dailyCap: number,
  pointsPer10Min: number,
): number {
  const raw = Math.floor(durationSec / 600) * pointsPer10Min
  return Math.max(0, Math.min(raw, dailyCap - alreadyEarnedToday))
}

export interface StreakState {
  streakCount: number
  lastStudyDate: string | null
  milestonesAwarded: number[]
}

export interface StreakUpdateResult extends StreakState {
  /** Non-null only when a new milestone bonus should be awarded this call. */
  milestoneBonus: { streakCount: number; amount: number } | null
}

/** Attendance/streak only advances when a session actually earned real
 * Study XP (`awardable > 0`) — never for a sub-10-minute session, and never
 * a second time on the same day (docs/StudyLog_XP_Level_Reward_Rules.md
 * §6). A day that earns 0 (too short, or the daily cap is already spent)
 * leaves the streak completely untouched rather than resetting it. */
export function computeStreakUpdate(
  state: StreakState,
  params: {
    awardable: number
    todayDateKey: string
    yesterdayDateKey: string
    milestones: Record<number, number>
  },
): StreakUpdateResult {
  const { streakCount, lastStudyDate, milestonesAwarded } = state
  if (params.awardable <= 0 || lastStudyDate === params.todayDateKey) {
    return { streakCount, lastStudyDate, milestonesAwarded, milestoneBonus: null }
  }

  const newStreakCount = lastStudyDate === params.yesterdayDateKey ? streakCount + 1 : 1
  const bonusAmount = params.milestones[newStreakCount]

  if (bonusAmount && !milestonesAwarded.includes(newStreakCount)) {
    return {
      streakCount: newStreakCount,
      lastStudyDate: params.todayDateKey,
      milestonesAwarded: [...milestonesAwarded, newStreakCount],
      milestoneBonus: { streakCount: newStreakCount, amount: bonusAmount },
    }
  }

  return {
    streakCount: newStreakCount,
    lastStudyDate: params.todayDateKey,
    milestonesAwarded,
    milestoneBonus: null,
  }
}
