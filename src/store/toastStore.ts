import { create } from 'zustand'

/** Ephemeral "you got a reward" feedback — never persisted (a toast from a
 * past session has no meaning on reload) and deliberately not a general
 * notification/message bus. Every call site is responsible for only calling
 * `pushToast` after its own store action reports real success (e.g.
 * `if (claimQuest(id)) pushToast(...)`), so a rapid double-click that the
 * underlying action already rejects (already claimed/owned) never produces
 * a duplicate toast either — no extra dedupe logic needed here. */
export interface RewardToast {
  id: string
  icon: string
  title: string
  subtitle?: string
  points?: number
}

const TOAST_DURATION_MS = 3200

interface ToastState {
  toasts: RewardToast[]
  pushToast: (toast: Omit<RewardToast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set({ toasts: [...get().toasts, { ...toast, id }] })
    window.setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}))
