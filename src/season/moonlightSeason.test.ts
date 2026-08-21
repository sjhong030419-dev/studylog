import { describe, expect, it } from 'vitest'
import { MOONLIGHT_REWARDS, canClaimMoonlightReward, moonlightSeasonProgress } from './moonlightSeason'

describe('moonlightSeasonProgress', () => {
  it('clamps progress between zero and the season target', () => {
    expect(moonlightSeasonProgress(-5)).toMatchObject({ currentXp: 0, percent: 0, complete: false })
    expect(moonlightSeasonProgress(45)).toMatchObject({ currentXp: 45, percent: 50, complete: false })
    expect(moonlightSeasonProgress(120)).toMatchObject({ currentXp: 90, percent: 100, complete: true })
  })
})

describe('canClaimMoonlightReward', () => {
  it('only allows reached and unclaimed milestones', () => {
    const reward = MOONLIGHT_REWARDS[0]
    expect(canClaimMoonlightReward(reward, 9, [])).toBe(false)
    expect(canClaimMoonlightReward(reward, 10, [])).toBe(true)
    expect(canClaimMoonlightReward(reward, 10, [reward.id])).toBe(false)
  })
})
