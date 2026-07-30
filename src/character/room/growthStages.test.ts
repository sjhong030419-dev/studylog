import { describe, expect, it } from 'vitest'
import { currentGrowthStage, unlockedAdditions, GROWTH_STAGES } from './growthStages'

describe('growth room unlocks', () => {
  it('unlocks are cumulative — everything at or below the current level stays unlocked', () => {
    const unlocked = unlockedAdditions(25)
    expect(unlocked.has('desk')).toBe(true) // Lv1
    expect(unlocked.has('plant')).toBe(true) // Lv10
    expect(unlocked.has('cat')).toBe(true) // Lv20
    expect(unlocked.has('chairUpgrade')).toBe(false) // Lv30, not yet reached
  })

  it('level thresholds return the expected additions', () => {
    expect(unlockedAdditions(1).has('desk')).toBe(true)
    expect(unlockedAdditions(9).has('plant')).toBe(false)
    expect(unlockedAdditions(10).has('plant')).toBe(true)
    expect(unlockedAdditions(19).has('cat')).toBe(false)
    expect(unlockedAdditions(20).has('cat')).toBe(true)
    expect(unlockedAdditions(100).has('premium')).toBe(true)
  })

  it('currentGrowthStage returns the highest reached stage, not the nearest', () => {
    expect(currentGrowthStage(1).label).toBe(GROWTH_STAGES[0].label)
    expect(currentGrowthStage(15).level).toBe(10)
    expect(currentGrowthStage(999).level).toBe(100)
  })

  it('a level below the first stage still resolves to the first stage (never undefined)', () => {
    expect(currentGrowthStage(0).level).toBe(1)
  })
})
