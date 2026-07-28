import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type CaptureRatio = 'square' | 'story'
export type MembershipPlan = 'free' | 'premium'

interface QuietHours {
  enabled: boolean
  start: string // "HH:MM"
  end: string // "HH:MM"
}

interface SettingsState {
  notifyStudyReminder: boolean
  notifyStreakWarning: boolean
  notifyRankChange: boolean
  theme: Theme
  captureDefaultRatio: CaptureRatio
  membership: MembershipPlan
  quietHours: QuietHours

  toggleNotifyStudyReminder: () => void
  toggleNotifyStreakWarning: () => void
  toggleNotifyRankChange: () => void
  setTheme: (theme: Theme) => void
  setCaptureDefaultRatio: (ratio: CaptureRatio) => void
  setQuietHours: (quietHours: Partial<QuietHours>) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifyStudyReminder: true,
      notifyStreakWarning: true,
      notifyRankChange: false,
      theme: 'light',
      captureDefaultRatio: 'square',
      membership: 'free',
      quietHours: { enabled: false, start: '22:00', end: '07:00' },

      toggleNotifyStudyReminder: () =>
        set((s) => ({ notifyStudyReminder: !s.notifyStudyReminder })),
      toggleNotifyStreakWarning: () =>
        set((s) => ({ notifyStreakWarning: !s.notifyStreakWarning })),
      toggleNotifyRankChange: () => set((s) => ({ notifyRankChange: !s.notifyRankChange })),
      setTheme: (theme) => set({ theme }),
      setCaptureDefaultRatio: (captureDefaultRatio) => set({ captureDefaultRatio }),
      setQuietHours: (quietHours) =>
        set((s) => ({ quietHours: { ...s.quietHours, ...quietHours } })),
    }),
    { name: 'studylog-settings' },
  ),
)
