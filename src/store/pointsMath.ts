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

/** Study XP total excluding the most recently earned study transaction —
 * used to show "level before this session" on the result/capture card
 * (PRD §14) from real transaction history, never a fabricated value. */
export function computeStudyXpTotalBeforeLastSession(transactions: PointTransaction[]): number {
  const studyTx = transactions.filter((t) => t.type === 'earn_study').sort((a, b) => a.timestamp - b.timestamp)
  if (studyTx.length === 0) return 0
  const last = studyTx[studyTx.length - 1]
  return computeStudyXpTotal(transactions) - last.amount
}
