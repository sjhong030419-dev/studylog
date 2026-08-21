import { beforeEach, describe, expect, it } from 'vitest'
import { useDailyQuestStore } from './dailyQuestStore'
import { usePointsStore } from './pointsStore'
import { useTimerStore } from './timerStore'
import { todayKey } from '../utils/time'

beforeEach(() => {
  useDailyQuestStore.setState({ claimedDateKey: null, claimedQuestIds: [] })
  usePointsStore.setState({ transactions: [], streakCount: 0, lastStudyDate: null, milestonesAwarded: [], school: null })
  useTimerStore.setState({ sessions: [] })
})

describe('claimQuest', () => {
  it('rejects an incomplete quest', () => {
    expect(useDailyQuestStore.getState().claimQuest('first-session')).toBe(false)
  })

  it('awards a completed quest exactly once', () => {
    useTimerStore.setState({ sessions: [{ id: 's1', subjectId: 'math', durationSec: 60, dateKey: todayKey(), startedAt: 0 }] })
    expect(useDailyQuestStore.getState().claimQuest('first-session')).toBe(true)
    expect(usePointsStore.getState().balance()).toBe(2)
    expect(useDailyQuestStore.getState().claimQuest('first-session')).toBe(false)
    expect(usePointsStore.getState().balance()).toBe(2)
  })

  it('resets the effective claim list when the stored date is old', () => {
    useDailyQuestStore.setState({ claimedDateKey: '2000-01-01', claimedQuestIds: ['first-session'] })
    useTimerStore.setState({ sessions: [{ id: 's1', subjectId: 'math', durationSec: 60, dateKey: todayKey(), startedAt: 0 }] })
    expect(useDailyQuestStore.getState().claimQuest('first-session')).toBe(true)
    expect(useDailyQuestStore.getState().claimedDateKey).toBe(todayKey())
  })
})
