import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOONLIGHT_REWARDS, canClaimMoonlightReward } from '../season/moonlightSeason'
import { usePointsStore } from './pointsStore'
import { useShopStore } from './shopStore'

interface SeasonState {
  claimedRewardIds: string[]
  claimMoonlightReward: (rewardId: string) => boolean
}

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set, get) => ({
      claimedRewardIds: [],
      claimMoonlightReward: (rewardId) => {
        const reward = MOONLIGHT_REWARDS.find((candidate) => candidate.id === rewardId)
        if (!reward) return false

        const studyXp = usePointsStore.getState().studyXpTotal()
        if (!canClaimMoonlightReward(reward, studyXp, get().claimedRewardIds)) return false

        if (reward.kind === 'points') {
          usePointsStore.getState().earn(reward.amount, `달빛 시즌 보상: ${reward.label}`)
        } else {
          const granted = useShopStore.getState().grantItem(reward.itemId, true)
          if (!granted) usePointsStore.getState().earn(80, '달빛 시즌 중복 스킨 대체 보상')
        }

        set({ claimedRewardIds: [...get().claimedRewardIds, reward.id] })
        return true
      },
    }),
    { name: 'studylog-season-v1' },
  ),
)
