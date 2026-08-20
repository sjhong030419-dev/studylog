export interface Achievement {
  id: string
  emoji: string
  label: string
}

export const ACHIEVEMENT_CATALOG: readonly Achievement[] = [
  { id: 'first', emoji: '🏅', label: '첫 기록' },
  { id: 'goal-today', emoji: '🎯', label: '목표 달성' },
  { id: 'streak-7', emoji: '🔥', label: '7일 연속' },
  { id: 'streak-30', emoji: '💎', label: '30일 연속' },
  { id: 'hours-30', emoji: '⭐', label: '30시간' },
  { id: 'hours-100', emoji: '👑', label: '100시간' },
]

interface AchievementInput {
  hasAnySession: boolean
  streakCount: number
  totalStudySec: number
  goalReachedToday: boolean
}

/**
 * Only ever returns badges the user has actually earned from real data
 * (sessions logged, streak count, cumulative time, today's goal). No fixed
 * inventory of "locked" fake badges — nothing is fabricated.
 */
export function deriveEarnedAchievements({
  hasAnySession,
  streakCount,
  totalStudySec,
  goalReachedToday,
}: AchievementInput): Achievement[] {
  const list: Achievement[] = []
  if (hasAnySession) list.push({ id: 'first', emoji: '🏅', label: '첫 기록' })
  if (goalReachedToday) list.push({ id: 'goal-today', emoji: '🎯', label: '목표 달성' })
  if (streakCount >= 7) list.push({ id: 'streak-7', emoji: '🔥', label: '7일 연속' })
  if (streakCount >= 30) list.push({ id: 'streak-30', emoji: '💎', label: '30일 연속' })
  if (totalStudySec >= 30 * 3600) list.push({ id: 'hours-30', emoji: '⭐', label: '30시간' })
  if (totalStudySec >= 100 * 3600) list.push({ id: 'hours-100', emoji: '👑', label: '100시간' })
  return list
}
