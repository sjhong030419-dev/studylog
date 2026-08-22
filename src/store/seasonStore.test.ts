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

  // Boundary tests for each of the 3 tiers (docs task: "9XP에서는 10XP 보상
  // 수령 불가 / 정확히 10XP에서 첫 보상 수령 가능", same pattern for 45/90).
  describe('per-tier XP boundaries', () => {
    it('rejects moonlight-10 at 9 XP, accepts at exactly 10 XP', () => {
      seedStudyXp(9)
      expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(false)
      seedStudyXp(1) // now exactly 10
      expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(true)
    })

    it('rejects moonlight-45 at 44 XP, accepts at exactly 45 XP', () => {
      seedStudyXp(44)
      expect(useSeasonStore.getState().claimMoonlightReward('moonlight-45')).toBe(false)
      seedStudyXp(1) // now exactly 45
      expect(useSeasonStore.getState().claimMoonlightReward('moonlight-45')).toBe(true)
    })

    it('rejects moonlight-90 at 89 XP, accepts at exactly 90 XP', () => {
      seedStudyXp(89)
      expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(false)
      seedStudyXp(1) // now exactly 90
      expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(true)
    })
  })

  it('never allows a reclaim of an already-claimed reward, at any tier', () => {
    seedStudyXp(90)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(true)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-10')).toBe(false)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-45')).toBe(true)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-45')).toBe(false)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(true)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(false)
  })

  it('the already-owned-skin 80P fallback pays out exactly once, not on a second attempt', () => {
    seedStudyXp(90)
    useShopStore.setState({ ownedItemIds: ['skin-moonlight-academy'], equipped: {} })
    const before = usePointsStore.getState().balance()
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(true)
    expect(usePointsStore.getState().balance()).toBe(before + 80)
    expect(useSeasonStore.getState().claimMoonlightReward('moonlight-90')).toBe(false)
    expect(usePointsStore.getState().balance()).toBe(before + 80) // unchanged by the rejected retry
  })

  it('reward points are never counted as Study XP (season progress cannot inflate itself)', () => {
    seedStudyXp(10)
    const studyXpBefore = usePointsStore.getState().studyXpTotal()
    useSeasonStore.getState().claimMoonlightReward('moonlight-10')
    expect(usePointsStore.getState().studyXpTotal()).toBe(studyXpBefore)
  })

  it('survives a JSON round-trip (the persisted shape) after claiming — reload cannot un-claim a reward', () => {
    seedStudyXp(90)
    useSeasonStore.getState().claimMoonlightReward('moonlight-10')
    useSeasonStore.getState().claimMoonlightReward('moonlight-45')
    const shape = { claimedRewardIds: useSeasonStore.getState().claimedRewardIds }
    const roundTripped = JSON.parse(JSON.stringify(shape))
    expect(roundTripped).toEqual(shape)
    expect(roundTripped.claimedRewardIds).toEqual(['moonlight-10', 'moonlight-45'])
  })
})
