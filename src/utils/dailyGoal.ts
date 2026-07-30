import type { PlannerTask } from '../store/plannerStore'
import type { StudySession } from '../types'

export type DailyGoalState =
  | { configured: false }
  | {
      configured: true
      targetSec: number
      achievedSec: number
      percent: number
      reached: boolean
    }

/**
 * Derives today's aggregate study goal from existing planner "time" tasks
 * and existing study sessions. Purely derived from real data — if no time
 * goal is registered for the day, reports `configured: false` rather than
 * fabricating a percentage.
 */
export function computeDailyGoal(
  tasks: PlannerTask[],
  sessions: StudySession[],
  dateKey: string,
): DailyGoalState {
  const timeTasks = tasks.filter((t) => t.dateKey === dateKey && t.targetType === 'time')
  if (timeTasks.length === 0) return { configured: false }

  const targetBySubject = new Map<string, number>()
  for (const task of timeTasks) {
    const minutes = task.targetMinutes ?? 0
    targetBySubject.set(task.subjectId, (targetBySubject.get(task.subjectId) ?? 0) + minutes * 60)
  }

  let targetSec = 0
  let achievedSec = 0
  for (const [subjectId, target] of targetBySubject) {
    targetSec += target
    achievedSec += sessions
      .filter((s) => s.dateKey === dateKey && s.subjectId === subjectId)
      .reduce((sum, s) => sum + s.durationSec, 0)
  }

  if (targetSec <= 0) return { configured: false }

  const percent = Math.round((achievedSec / targetSec) * 100)
  return { configured: true, targetSec, achievedSec, percent, reached: achievedSec >= targetSec }
}
