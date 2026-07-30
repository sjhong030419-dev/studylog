import { describe, expect, it } from 'vitest'
import { computeBalance, computeStudyXpTotal, computeStudyXpTotalBeforeLastSession } from './pointsMath'
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

describe('computeStudyXpTotalBeforeLastSession (PRD §14 level before/after)', () => {
  it('returns 0 when there is no study history', () => {
    expect(computeStudyXpTotalBeforeLastSession([])).toBe(0)
  })

  it('excludes only the most recently earned study transaction', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10, timestamp: 1 }),
      tx({ type: 'earn_study', amount: 6, timestamp: 2 }),
    ]
    expect(computeStudyXpTotalBeforeLastSession(transactions)).toBe(10)
  })

  it('ignores transaction array order and uses timestamp to find the last session', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 6, timestamp: 2 }),
      tx({ type: 'earn_study', amount: 10, timestamp: 1 }),
    ]
    expect(computeStudyXpTotalBeforeLastSession(transactions)).toBe(10)
  })

  it('is unaffected by non-study transactions', () => {
    const transactions = [
      tx({ type: 'earn_study', amount: 10, timestamp: 1 }),
      tx({ type: 'earn_streak', amount: 5, timestamp: 2 }),
      tx({ type: 'earn_study', amount: 6, timestamp: 3 }),
      tx({ type: 'spend', amount: 8, timestamp: 4 }),
    ]
    expect(computeStudyXpTotalBeforeLastSession(transactions)).toBe(10)
  })
})
