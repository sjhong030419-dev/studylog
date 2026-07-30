import type { DailyGoalState } from './dailyGoal'

interface CaptureMessageInput {
  todayTotalSec: number
  yesterdayTotalSec: number
  goal: DailyGoalState
  streakCount: number
}

/**
 * One-line message for the capture card. Deterministic, rule-based —
 * purely a function of real today/yesterday/goal/streak data, never
 * hardcoded to a single string and never fabricated.
 */
export function deriveCaptureMessage({
  todayTotalSec,
  yesterdayTotalSec,
  goal,
  streakCount,
}: CaptureMessageInput): string {
  if (todayTotalSec === 0) return '아직 오늘 기록이 없어요. 지금 시작해볼까요? 📖'
  if (goal.configured && goal.reached) return '오늘 목표를 달성했어요! 최고예요 🎉'
  if (yesterdayTotalSec > 0 && todayTotalSec > yesterdayTotalSec) {
    const diffMin = Math.round((todayTotalSec - yesterdayTotalSec) / 60)
    return `어제보다 ${diffMin}분 더 공부했어요! 🔥`
  }
  if (yesterdayTotalSec > 0 && todayTotalSec < yesterdayTotalSec) {
    return '오늘은 조금 쉬었네요. 내일 다시 화이팅! 🌱'
  }
  if (streakCount >= 3) return `${streakCount}일 연속 공부 중이에요! 대단해요 ✨`
  return '오늘도 한 걸음 성장했어요 🌟'
}
