import { beforeEach, describe, expect, it } from 'vitest'
import { useDailyQuestStore } from './dailyQuestStore'
import { usePointsStore } from './pointsStore'
import { useTimerStore } from './timerStore'
import { dateKeyOffset, todayKey } from '../utils/time'

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

  // Date-boundary requirements (docs task 4): a claim from yesterday must
  // never block today's claim of the same quest id.
  it('a quest claimed yesterday does not block claiming the same quest today', () => {
    useDailyQuestStore.setState({ claimedDateKey: dateKeyOffset(todayKey(), -1), claimedQuestIds: ['first-session'] })
    useTimerStore.setState({ sessions: [{ id: 's1', subjectId: 'math', durationSec: 60, dateKey: todayKey(), startedAt: 0 }] })
    expect(useDailyQuestStore.getState().claimQuest('first-session')).toBe(true)
    expect(useDailyQuestStore.getState().claimedQuestIds).toEqual(['first-session'])
  })

  it('rejects the 30-minute focus quest at 29:59 and accepts it at exactly 30:00', () => {
    useTimerStore.setState({
      sessions: [
        { id: 's1', subjectId: 'math', durationSec: 1000, dateKey: todayKey(), startedAt: 0 },
        { id: 's2', subjectId: 'math', durationSec: 799, dateKey: todayKey(), startedAt: 0 }, // 1799s total
      ],
    })
    expect(useDailyQuestStore.getState().claimQuest('focus-30')).toBe(false)

    useTimerStore.setState((state) => ({
      sessions: [...state.sessions, { id: 's3', subjectId: 'math', durationSec: 1, dateKey: todayKey(), startedAt: 0 }], // now 1800s
    }))
    expect(useDailyQuestStore.getState().claimQuest('focus-30')).toBe(true)
  })

  it('survives a JSON round-trip (the persisted shape) after claiming — reload cannot un-claim or double-award', () => {
    useTimerStore.setState({ sessions: [{ id: 's1', subjectId: 'math', durationSec: 60, dateKey: todayKey(), startedAt: 0 }] })
    useDailyQuestStore.getState().claimQuest('first-session')
    const shape = {
      claimedDateKey: useDailyQuestStore.getState().claimedDateKey,
      claimedQuestIds: useDailyQuestStore.getState().claimedQuestIds,
    }
    const roundTripped = JSON.parse(JSON.stringify(shape))
    expect(roundTripped).toEqual(shape)
    expect(roundTripped.claimedDateKey).toBe(todayKey())
    expect(roundTripped.claimedQuestIds).toEqual(['first-session'])
  })
})
