import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deriveDailyQuests } from '../quests/dailyQuests'
import { todayKey } from '../utils/time'
import { usePointsStore } from './pointsStore'
import { useTimerStore } from './timerStore'

interface DailyQuestState {
  claimedDateKey: string | null
  claimedQuestIds: string[]
  claimQuest: (questId: string) => boolean
}

export const useDailyQuestStore = create<DailyQuestState>()(
  persist(
    (set, get) => ({
      claimedDateKey: null,
      claimedQuestIds: [],
      claimQuest: (questId) => {
        const key = todayKey()
        const claimedIds = get().claimedDateKey === key ? get().claimedQuestIds : []
        if (claimedIds.includes(questId)) return false

        const quest = deriveDailyQuests(useTimerStore.getState().sessions, key).find((candidate) => candidate.id === questId)
        if (!quest?.complete) return false

        usePointsStore.getState().earn(quest.rewardPoints, `오늘의 퀘스트: ${quest.title}`)
        set({ claimedDateKey: key, claimedQuestIds: [...claimedIds, quest.id] })
        return true
      },
    }),
    { name: 'studylog-daily-quests' },
  ),
)
