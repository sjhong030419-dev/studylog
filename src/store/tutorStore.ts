import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayKey } from '../utils/time'
import { usePointsStore } from './pointsStore'

export const FREE_DAILY_LIMIT = 5
export const EXTRA_BUNDLE_COST = 10
export const EXTRA_BUNDLE_SIZE = 3

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  subjectId: string
  mock?: boolean
  timestamp: number
}

interface TutorState {
  messages: ChatMessage[]
  dateKey: string
  askedToday: number
  extraPurchasedToday: number
  loading: boolean
  error: string | null

  remainingToday: () => number
  ensureFreshDay: () => void
  sendMessage: (subjectId: string, message: string) => Promise<void>
  buyExtraQuestions: () => boolean
}

export const useTutorStore = create<TutorState>()(
  persist(
    (set, get) => ({
      messages: [],
      dateKey: todayKey(),
      askedToday: 0,
      extraPurchasedToday: 0,
      loading: false,
      error: null,

      remainingToday: () => {
        get().ensureFreshDay()
        const { askedToday, extraPurchasedToday } = get()
        return FREE_DAILY_LIMIT + extraPurchasedToday - askedToday
      },

      ensureFreshDay: () => {
        const key = todayKey()
        if (get().dateKey !== key) {
          set({ dateKey: key, askedToday: 0, extraPurchasedToday: 0 })
        }
      },

      sendMessage: async (subjectId, message) => {
        const trimmed = message.trim()
        if (!trimmed) return
        get().ensureFreshDay()
        if (get().remainingToday() <= 0) {
          set({ error: '오늘의 질문 횟수를 다 썼어요. 포인트로 더 받아보세요!' })
          return
        }

        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: trimmed,
          subjectId,
          timestamp: Date.now(),
        }
        set({ messages: [...get().messages, userMessage], loading: true, error: null })

        try {
          const history = get()
            .messages.filter((m) => m.subjectId === subjectId)
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content }))

          const res = await fetch('/api/tutor', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ subjectId, message: trimmed, history }),
          })

          if (!res.ok) throw new Error('서버 오류가 발생했어요')
          const data = await res.json()

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-a`,
            role: 'assistant',
            content: data.reply ?? '음... 다시 한 번 물어봐 줄래요?',
            subjectId,
            mock: Boolean(data.mock),
            timestamp: Date.now(),
          }
          set({
            messages: [...get().messages, assistantMessage],
            askedToday: get().askedToday + 1,
          })
        } catch {
          set({ error: 'AI 튜터에게 연결할 수 없어요. 백엔드 서버가 켜져 있는지 확인해주세요.' })
        } finally {
          set({ loading: false })
        }
      },

      buyExtraQuestions: () => {
        const ok = usePointsStore
          .getState()
          .spend(EXTRA_BUNDLE_COST, `AI 튜터 질문권 +${EXTRA_BUNDLE_SIZE}개`)
        if (!ok) return false
        set({ extraPurchasedToday: get().extraPurchasedToday + EXTRA_BUNDLE_SIZE })
        return true
      },
    }),
    { name: 'studylog-tutor' },
  ),
)
