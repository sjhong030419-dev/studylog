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

/** RewardToastHost is a fixed stack at the top of the screen — beyond a
 * few at once it would start covering real content underneath, so a new
 * toast past this count evicts the oldest rather than growing forever. This
 * only ever trims what's on screen: the reward that triggered the evicted
 * toast was already granted by its own store action before `pushToast` was
 * even called, so trimming the toast list can never take back points or an
 * item. */
export const MAX_VISIBLE_TOASTS = 3

interface ToastState {
  toasts: RewardToast[]
  pushToast: (toast: Omit<RewardToast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    // Timestamp + random suffix, not just the timestamp alone: two toasts
    // pushed within the same millisecond (e.g. a quest claim followed
    // immediately by a season claim) would otherwise collide on id, and a
    // `key`/dismiss collision would make React drop or misdismiss one of
    // them.
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const withNewToast = [...get().toasts, { ...toast, id }]
    // Drop from the front (oldest first) — the array is always in the
    // order toasts were pushed, so the newest MAX_VISIBLE_TOASTS are always
    // the trailing slice.
    const visible = withNewToast.slice(-MAX_VISIBLE_TOASTS)
    set({ toasts: visible })
    // Plain `setTimeout`, not `window.setTimeout`: this store has no DOM
    // dependency otherwise, and referencing `window` explicitly made it
    // impossible to unit test under this project's `node` vitest
    // environment (`window` is genuinely undefined there — confirmed
    // before this fix). Both resolve to the same global timer in a real
    // browser, so this changes no runtime behavior.
    setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}))
