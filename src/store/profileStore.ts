import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Gender } from '../character/types'

interface ProfileState {
  nickname: string
  gender: Gender
  onboardingCompleted: boolean
  setNickname: (name: string) => void
  setGender: (gender: Gender) => void
  completeOnboarding: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      nickname: '나',
      gender: 'boy',
      // New installs only — see `migrate` below for why every existing user
      // skips onboarding on upgrade (PRD §19 "preserve existing users'
      // direct entry into the app").
      onboardingCompleted: false,
      setNickname: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set({ nickname: trimmed })
      },
      setGender: (gender) => set({ gender }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
    }),
    {
      name: 'studylog-profile',
      version: 1,
      // Any profile persisted before this field existed (version 0/undefined)
      // belongs to an existing user — treat onboarding as already done for
      // them rather than surfacing it retroactively.
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<ProfileState>
        if (version < 1) return { ...state, onboardingCompleted: true }
        return state
      },
    },
  ),
)
