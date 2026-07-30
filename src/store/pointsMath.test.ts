import { describe, expect, it } from 'vitest'
import {
  computeAwardableStudyXp,
  computeBalance,
  computeStreakUpdate,
  computeStudyXpBeforeTodaysLastSession,
  computeStudyXpTotal,
  type StreakState,
} from './pointsMath'
import type { PointTransaction } from '../types'

function tx(partial: Partial<PointTransaction> & Pick<PointTransaction, 'type' | 'amount'>): PointTransaction {
  return {
    id: `t-${Math.random()}`,
    reason: 'test',
    dateKey: '2026-01-01',
    timestamp: 0,
    ...partial,
  }
}

describe('Study XP vs. spendable points (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §8)', () => {
  it('a study session increases Study XP', () => {
    const transactions = [tx({ type: 'earn_study', amount: 6 })]
    expect(computeStudyXpTotal(transactions)).toBe(6)
  })

  it('an advertisement bonus increases point balance but not Study XP', () => {
    const transactions = [tx({ type: 'earn_other', amount: 5, reason: '광고 시청 보너스' })]
    expect(computeBalance(transactions)).toBe(5)
    expect(computeStudyXpTotal(transactions)).toBe(0)
  })

  it('a streak bonus increases point balance but not Study XP', () => {
    const transactions = [tx({ type: 'earn_streak', amount: 15 })]
    expect(computeBalance(transactions)).toBe(15)
    expect(computeStudyXpTotal(transactions)).toBe(0)
  })

  it('spending points decreases balance but not Study XP', () => {
    const transactions = [tx({ type: 'earn_study', amount: 20 }), tx({ type: 'spend', amount: 8 })]
    expect(computeBalance(transactions)).toBe(12)
    expect(computeStudyXpTotal(transactions)).toBe(20)
  })

  it('level (derived from Study XP) stays stable after a cosmetic purchase', () => {
    const before = computeStudyXpTotal([tx({ type: 'earn_study', amount: 20 })])
    const after = computeStudyXpTotal([tx({ type: 'earn_study', amount: 20 }), tx({ type: 'spend', amount: 20 })])
    expect(after).toBe(before)
  })

  it('mixes study, streak, ad, and spend transactions correctly', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10 }),
      tx({ type: 'earn_streak', amount: 5 }),
      tx({ type: 'earn_other', amount: 5 }),
      tx({ type: 'earn_study', amount: 4 }),
      tx({ type: 'spend', amount: 12 }),
    ]
    expect(computeBalance(transactions)).toBe(10 + 5 + 5 + 4 - 12)
    expect(computeStudyXpTotal(transactions)).toBe(10 + 4)
  })
})

describe('computeStudyXpBeforeTodaysLastSession (PRD §14 level before/after, capture-card bug fix)', () => {
  const today = '2026-07-31'
  const yesterday = '2026-07-30'

  it('returns undefined when there are no transactions at all', () => {
    expect(computeStudyXpBeforeTodaysLastSession([], today)).toBeUndefined()
  })

  it('returns undefined when Study XP only exists on a past day', () => {
    const transactions = [tx({ type: 'earn_study', amount: 10, dateKey: yesterday, timestamp: 1 })]
    expect(computeStudyXpBeforeTodaysLastSession(transactions, today)).toBeUndefined()
  })

  it('excludes only the most recently earned study transaction FROM TODAY', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10, dateKey: yesterday, timestamp: 1 }),
      tx({ type: 'earn_study', amount: 5, dateKey: today, timestamp: 2 }),
      tx({ type: 'earn_study', amount: 6, dateKey: today, timestamp: 3 }),
    ]
    // Total is 21; only today's last (amount 6) is excluded from "before".
    expect(computeStudyXpBeforeTodaysLastSession(transactions, today)).toBe(15)
  })

  it('ignores transaction array order and uses timestamp to find the last session', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 6, dateKey: today, timestamp: 2 }),
      tx({ type: 'earn_study', amount: 10, dateKey: today, timestamp: 1 }),
    ]
    expect(computeStudyXpBeforeTodaysLastSession(transactions, today)).toBe(10)
  })

  it('is unaffected by non-study transactions today', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10, dateKey: today, timestamp: 1 }),
      tx({ type: 'earn_streak', amount: 5, dateKey: today, timestamp: 2 }),
      tx({ type: 'earn_other', amount: 5, dateKey: today, timestamp: 3 }),
    ]
    // Only one earn_study today, so "before" is everything except it: 0.
    expect(computeStudyXpBeforeTodaysLastSession(transactions, today)).toBe(0)
  })

  it('returns undefined when today only has ad points (earn_other)', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10, dateKey: yesterday, timestamp: 1 }),
      tx({ type: 'earn_other', amount: 5, dateKey: today, timestamp: 2 }),
    ]
    expect(computeStudyXpBeforeTodaysLastSession(transactions, today)).toBeUndefined()
  })

  it('returns undefined when today only has a streak bonus (earn_streak)', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10, dateKey: yesterday, timestamp: 1 }),
      tx({ type: 'earn_streak', amount: 15, dateKey: today, timestamp: 2 }),
    ]
    expect(computeStudyXpBeforeTodaysLastSession(transactions, today)).toBeUndefined()
  })
})

describe('computeAwardableStudyXp (10-minute floor + daily cap)', () => {
  it('a 1-second session earns 0', () => {
    expect(computeAwardableStudyXp(1, 0, 60, 1)).toBe(0)
  })

  it('a 9:59 session earns 0', () => {
    expect(computeAwardableStudyXp(599, 0, 60, 1)).toBe(0)
  })

  it('a 10:00 session earns 1', () => {
    expect(computeAwardableStudyXp(600, 0, 60, 1)).toBe(1)
  })

  it('is capped by remaining daily headroom', () => {
    expect(computeAwardableStudyXp(6000, 55, 60, 1)).toBe(5)
  })

  it('returns 0 once the daily cap is already spent', () => {
    expect(computeAwardableStudyXp(6000, 60, 60, 1)).toBe(0)
  })
})

describe('computeStreakUpdate (P1 fix: sub-10-minute sessions must not start/bump a streak)', () => {
  const today = '2026-07-31'
  const yesterday = '2026-07-30'
  const twoDaysAgo = '2026-07-29'
  const milestones = { 3: 5, 7: 15 }

  function freshState(overrides: Partial<StreakState> = {}): StreakState {
    return { streakCount: 0, lastStudyDate: null, milestonesAwarded: [], ...overrides }
  }

  it('a 1-second session (awardable 0) does not start a streak', () => {
    const result = computeStreakUpdate(freshState(), {
      awardable: 0,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(0)
    expect(result.lastStudyDate).toBeNull()
  })

  it('a 9:59 session (awardable 0) does not start a streak', () => {
    const result = computeStreakUpdate(freshState(), {
      awardable: 0,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(0)
  })

  it('a 10-minute session (awardable > 0) starts a streak', () => {
    const result = computeStreakUpdate(freshState(), {
      awardable: 1,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(1)
    expect(result.lastStudyDate).toBe(today)
  })

  it('logging multiple qualifying sessions the same day only bumps the streak once', () => {
    const first = computeStreakUpdate(freshState(), {
      awardable: 1,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    const second = computeStreakUpdate(first, {
      awardable: 1,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(second.streakCount).toBe(1)
    expect(second.lastStudyDate).toBe(today)
  })

  it('a qualifying session on the consecutive next day increments the streak', () => {
    const result = computeStreakUpdate(freshState({ streakCount: 4, lastStudyDate: yesterday }), {
      awardable: 1,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(5)
  })

  it('a qualifying session after a skipped day restarts the streak at 1', () => {
    const result = computeStreakUpdate(freshState({ streakCount: 9, lastStudyDate: twoDaysAgo }), {
      awardable: 1,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(1)
  })

  it('a sub-10-minute session can never earn a milestone bonus', () => {
    // Even set up one day before a milestone, a 0-awardable session must
    // not advance the streak into the milestone at all.
    const result = computeStreakUpdate(freshState({ streakCount: 2, lastStudyDate: yesterday }), {
      awardable: 0,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(2)
    expect(result.milestoneBonus).toBeNull()
  })

  it('reaching a real milestone with a qualifying session awards the bonus once', () => {
    const result = computeStreakUpdate(freshState({ streakCount: 2, lastStudyDate: yesterday }), {
      awardable: 1,
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(3)
    expect(result.milestoneBonus).toEqual({ streakCount: 3, amount: 5 })
    expect(result.milestonesAwarded).toEqual([3])
  })

  it('an additional session after the daily cap is reached does not change the existing streak', () => {
    const capped = freshState({ streakCount: 5, lastStudyDate: today })
    const result = computeStreakUpdate(capped, {
      awardable: 0, // e.g. daily cap already spent earlier today
      todayDateKey: today,
      yesterdayDateKey: yesterday,
      milestones,
    })
    expect(result.streakCount).toBe(5)
    expect(result.lastStudyDate).toBe(today)
    expect(result.milestonesAwarded).toEqual([])
    expect(result.milestoneBonus).toBeNull()
  })
})
