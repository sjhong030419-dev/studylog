import type { StudySession } from '../types'

export interface DailyQuestProgress {
  id: 'first-session' | 'focus-30' | 'two-subjects'
  title: string
  description: string
  emoji: string
  rewardPoints: number
  current: number
  target: number
  unit: string
  complete: boolean
  percent: number
}

function progress(current: number, target: number) {
  return Math.min(100, Math.round((Math.max(0, current) / target) * 100))
}

/** True only when every real daily quest is actually complete for
 * `dateKey` — the single source of truth for any "오늘의 퀘스트 완료" claim
 * shown to the user (e.g. the capture/share card), so that claim can never
 * drift from the quest board's own completion state
 * (docs/Claude_3Hour_MVP_Quality_Sprint.md §1: never fabricate an
 * achievement the user hasn't actually earned). */
export function allDailyQuestsComplete(sessions: readonly StudySession[], dateKey: string): boolean {
  return deriveDailyQuests(sessions, dateKey).every((quest) => quest.complete)
}

export function deriveDailyQuests(sessions: readonly StudySession[], dateKey: string): DailyQuestProgress[] {
  const today = sessions.filter((session) => session.dateKey === dateKey && session.durationSec > 0)
  const totalSec = today.reduce((sum, session) => sum + session.durationSec, 0)
  const subjectCount = new Set(today.map((session) => session.subjectId)).size

  return [
    {
      id: 'first-session', title: '첫 모험 시작', description: '공부 기록 1회 남기기', emoji: '✏️', rewardPoints: 2,
      current: Math.min(today.length, 1), target: 1, unit: '회', complete: today.length >= 1, percent: progress(today.length, 1),
    },
    {
      id: 'focus-30', title: '집중의 불씨', description: '오늘 30분 공부하기', emoji: '🔥', rewardPoints: 5,
      current: Math.min(Math.floor(totalSec / 60), 30), target: 30, unit: '분', complete: totalSec >= 1800, percent: progress(totalSec, 1800),
    },
    {
      id: 'two-subjects', title: '균형 잡힌 하루', description: '서로 다른 과목 2개 공부하기', emoji: '📚', rewardPoints: 5,
      current: Math.min(subjectCount, 2), target: 2, unit: '과목', complete: subjectCount >= 2, percent: progress(subjectCount, 2),
    },
  ]
}
