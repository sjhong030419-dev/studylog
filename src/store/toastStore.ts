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

// Module-scoped, strictly increasing — the one thing `generateToastId`'s
// uniqueness actually depends on. `Date.now()`/`Math.random()` are still
// folded in (a toast id stays roughly time-sortable, which helps while
// debugging), but correctness never relies on either being distinct: even
// if `Date.now()` and `Math.random()` both returned the exact same value on
// every call — the pathological case a real UUID scheme still has to
// reason about — `toastIdSequence` alone already guarantees every id this
// module ever produces differs from every other one, for the lifetime of
// the page. No UUID dependency needed for that guarantee.
let toastIdSequence = 0

/** Pulled out of `pushToast` so its uniqueness can be verified directly
 * against an unbounded number of calls — `pushToast` itself only ever
 * keeps `MAX_VISIBLE_TOASTS` toasts around, so sampling ids off the store
 * after many pushes would only ever see the last few survivors. */
export function generateToastId(): string {
  toastIdSequence += 1
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${toastIdSequence}`
}

interface ToastState {
  toasts: RewardToast[]
  pushToast: (toast: Omit<RewardToast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = generateToastId()
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
