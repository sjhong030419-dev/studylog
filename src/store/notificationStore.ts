import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppNotification, NavTarget, NotificationType } from '../types'

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'event',
    title: '스터디로그에 오신 걸 환영해요! 🎉',
    body: '오늘의 첫 공부를 시작하고 포인트를 모아보세요.',
    read: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    linkTarget: 'timer',
  },
  {
    id: 'n2',
    type: 'rank_overtaken',
    title: '하늘님이 전체 랭킹에서 나를 추월했어요',
    body: '랭킹 화면에서 확인하고 다시 순위를 올려보세요!',
    read: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    linkTarget: 'ranking',
  },
  {
    id: 'n3',
    type: 'streak_warning',
    title: '오늘 아직 공부 기록이 없어요',
    body: '자정 전에 타이머를 한 번이라도 돌리면 연속 출석이 이어져요.',
    read: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    linkTarget: 'timer',
  },
]

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: () => number
  add: (type: NotificationType, title: string, body: string, linkTarget?: NavTarget) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: SEED_NOTIFICATIONS,

      unreadCount: () => get().notifications.filter((n) => !n.read).length,

      add: (type, title, body, linkTarget) => {
        const notification: AppNotification = {
          id: `notif-${Date.now()}`,
          type,
          title,
          body,
          read: false,
          createdAt: Date.now(),
          linkTarget,
        }
        set({ notifications: [notification, ...get().notifications] })
      },

      markRead: (id) => {
        set({
          notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })
      },

      markAllRead: () => {
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) })
      },
    }),
    { name: 'studylog-notifications' },
  ),
)
