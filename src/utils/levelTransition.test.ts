import { describe, expect, it } from 'vitest'
import { deriveLevelBeforeToday } from './levelTransition'

describe('deriveLevelBeforeToday (capture card level before/after, PRD §14)', () => {
  it('no transactions at all -> no previous level', () => {
    expect(deriveLevelBeforeToday(0, undefined)).toBeUndefined()
  })

  it('only a past day has Study XP -> no previous level', () => {
    // Caller passes undefined once computeStudyXpBeforeTodaysLastSession
    // finds no earn_study transaction dated today.
    expect(deriveLevelBeforeToday(10, undefined)).toBeUndefined()
  })

  it('today has Study XP but the level did not change -> no transition shown', () => {
    // Both 5 and 15 total XP stay under the 20 XP needed for level 2.
    expect(deriveLevelBeforeToday(15, 5)).toBeUndefined()
  })

  it('today real Study XP actually leveled up -> returns the previous level', () => {
    // 15 XP is level 1; 25 XP crosses the 20-XP boundary into level 2.
    expect(deriveLevelBeforeToday(25, 15)).toBe(1)
  })

  it('only ad points earned today -> no previous level', () => {
    expect(deriveLevelBeforeToday(10, undefined)).toBeUndefined()
  })

  it('only a streak bonus earned today -> no previous level', () => {
    expect(deriveLevelBeforeToday(10, undefined)).toBeUndefined()
  })
})
