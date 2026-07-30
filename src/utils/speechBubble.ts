import type { CharacterState } from '../character/types'
import type { DailyGoalState } from './dailyGoal'

interface SpeechBubbleInput {
  characterState: CharacterState
  todayTotalSec: number
  goal: DailyGoalState
  streakCount: number
}

/**
 * Deterministic, rule-based supportive copy — no AI dependency, no shame
 * or pressure. Purely a function of existing real state.
 */
export function deriveSpeechBubble({
  characterState,
  todayTotalSec,
  goal,
  streakCount,
}: SpeechBubbleInput): string {
  if (characterState === 'levelUp') return '레벨 업! 정말 멋져요 🎉'
  if (characterState === 'happy') return '수고했어요! 오늘도 한 걸음 성장했어요 🌟'
  if (characterState === 'away') return '어? 어디 갔었어요? 👀'
  if (characterState === 'sleep') return '조금 쉬었다 할까요? 😴'
  if (goal.configured && goal.reached) return '오늘 목표 달성했어요! 최고예요 🎉'
  if (characterState === 'study') return '집중하고 있어요! 화이팅 🔥'
  if (characterState === 'break') return '잠깐 쉬는 중이에요 ☕'
  if (streakCount >= 3) return `${streakCount}일 연속 출석 중이에요! 대단해요 ✨`
  if (todayTotalSec === 0) return '오늘도 함께 공부해볼까요? 📖'
  return '오늘도 조금씩 성장하고 있어요 🌱'
}
