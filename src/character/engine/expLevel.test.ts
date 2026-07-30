import { describe, expect, it } from 'vitest'
import { deriveExpLevel, expRequiredForLevel } from './expLevel'

describe('deriveExpLevel', () => {
  it('zero XP starts at level 1', () => {
    const result = deriveExpLevel(0)
    expect(result.level).toBe(1)
    expect(result.expIntoLevel).toBe(0)
  })

  it('negative input is clamped to zero XP / level 1, never a negative level', () => {
    const result = deriveExpLevel(-500)
    expect(result.level).toBe(1)
    expect(result.exp).toBe(0)
  })

  it('produces the expected next level exactly at the XP boundary', () => {
    const needed = expRequiredForLevel(1)

    const justBelow = deriveExpLevel(needed - 1)
    expect(justBelow.level).toBe(1)

    const atBoundary = deriveExpLevel(needed)
    expect(atBoundary.level).toBe(2)
    expect(atBoundary.expIntoLevel).toBe(0)
  })

  it('progressRatio is 0 at the start of a level and approaches 1 near the next', () => {
    const needed = expRequiredForLevel(1)
    const start = deriveExpLevel(needed)
    expect(start.progressRatio).toBe(0)

    const secondNeeded = expRequiredForLevel(2)
    const almostNext = deriveExpLevel(needed + secondNeeded - 1)
    expect(almostNext.level).toBe(2)
    expect(almostNext.progressRatio).toBeCloseTo((secondNeeded - 1) / secondNeeded, 5)
  })
})
