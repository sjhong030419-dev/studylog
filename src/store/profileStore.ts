import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  nickname: string
  setNickname: (name: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      nickname: '나',
      setNickname: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set({ nickname: trimmed })
      },
    }),
    { name: 'studylog-profile' },
  ),
)
