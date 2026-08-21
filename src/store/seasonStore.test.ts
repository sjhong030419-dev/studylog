import { beforeEach, describe, expect, it } from 'vitest'
import { usePointsStore } from './pointsStore'
import { useSeasonStore } from './seasonStore'
import { useShopStore } from './shopStore'

beforeEach(() => {
  usePointsStore.setState({ transactions: [], streakCount: 0, lastStudyDate: null, milestonesAwarded: [], school: null })
  useShopStore.setState({ ownedItemIds: [], equipped: {} })
  useSeasonStore.setState({ claimedRewardIds: [] })
})

function seedStudyXp(amount: number) {
  usePointsStore.getState().earn(amount, 'test')
  usePointsStore.setState((state) => ({
    transactions: state.transactions.map((transaction) => ({ ...transaction, type: 'earn_study' as const })),
  }))
}

describe('claimMoonlightReward', () => {
  it('rejects a reward before its XP milestone', () => {
    seedStudyXp(9)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(false)
  })

  it('awards points exactly once', () => {
    seedStudyXp(10)
    const before = usePointsStore.getState().balance()
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(true)
    expect(usePointsStore.getState().balance()).toBe(before + 10)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(false)
  })

  it('grants and equips the final cosmetic', () => {
    seedStudyXp(90)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(true)
    expect(useShopStore.getState().ownedItemIds).toContain('skin-moonlight-academy')
    expect(useShopStore.getState().equipped.skin).toBe('skin-moonlight-academy')
  })

  it('awards replacement points when the final cosmetic is already owned', () => {
    seedStudyXp(90)
    useShopStore.setState({ ownedItemIds: ['skin-moonlight-academy'], equipped: {} })
    const before = usePointsStore.getState().balance()
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(true)
    expect(usePointsStore.getState().balance()).toBe(before + 80)
  })
})
