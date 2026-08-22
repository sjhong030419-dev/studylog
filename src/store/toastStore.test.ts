import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_VISIBLE_TOASTS, useToastStore } from './toastStore'

const INITIAL_STATE = useToastStore.getState()

beforeEach(() => {
  useToastStore.setState(INITIAL_STATE, true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pushToast', () => {
  it('adds exactly one toast', () => {
    useToastStore.getState().pushToast({ icon: '🎉', title: 'Test' })
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('stores title, subtitle, icon, and points without loss', () => {
    useToastStore.getState().pushToast({ icon: '⭐', title: '제목', subtitle: '부제목', points: 42 })
    const [toast] = useToastStore.getState().toasts
    expect(toast).toMatchObject({ icon: '⭐', title: '제목', subtitle: '부제목', points: 42 })
  })

  it('omits subtitle/points cleanly when the caller does not pass them', () => {
    useToastStore.getState().pushToast({ icon: '📦', title: '무보상 알림' })
    const [toast] = useToastStore.getState().toasts
    expect(toast.subtitle).toBeUndefined()
    expect(toast.points).toBeUndefined()
  })

  it('assigns ids that never collide, even when pushed within the same millisecond', () => {
    // Date.now() pinned to a single value so uniqueness can only come from
    // the random suffix, not natural clock drift between calls.
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    for (let i = 0; i < 20; i++) {
      useToastStore.getState().pushToast({ icon: 'x', title: `t${i}` })
    }
    const ids = useToastStore.getState().toasts.map((toast) => toast.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('loses nothing across several rapid, synchronous pushes (within the visible cap)', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    useToastStore.getState().pushToast({ icon: '2', title: 'two' })
    useToastStore.getState().pushToast({ icon: '3', title: 'three' })
    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['one', 'two', 'three'])
  })
})

describe('dismissToast', () => {
  it('removes only the targeted toast', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    useToastStore.getState().pushToast({ icon: '2', title: 'two' })
    const [first, second] = useToastStore.getState().toasts
    useToastStore.getState().dismissToast(first.id)
    expect(useToastStore.getState().toasts).toEqual([second])
  })

  it('dismissing an id that does not exist leaves every other toast untouched', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    useToastStore.getState().pushToast({ icon: '2', title: 'two' })
    const before = useToastStore.getState().toasts
    expect(() => useToastStore.getState().dismissToast('not-a-real-id')).not.toThrow()
    expect(useToastStore.getState().toasts).toEqual(before)
  })
})

describe('auto-dismiss timer (fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('does not remove the toast before its duration elapses', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    vi.advanceTimersByTime(3199)
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('removes the toast automatically once its duration elapses, leaving no pending timer behind', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    vi.advanceTimersByTime(3200)
    expect(useToastStore.getState().toasts).toHaveLength(0)
    // Proves the timer actually fired and was consumed — not just that the
    // state happens to look right — so nothing is left pending at test end.
    expect(vi.getTimerCount()).toBe(0)
  })

  // "컴포넌트가 사라진 뒤에도 React state 관련 경고가 발생하지 않음": this repo's
  // vitest environment is `node` (vite.config.ts — no DOM/React renderer), so
  // an actual mount/unmount can't be exercised here. What IS exercised, and
  // is the real reason this is safe: `dismissToast` only ever calls
  // Zustand's `set()` on the store itself — never a React `setState` — so it
  // has nothing that could warn about updating an unmounted component
  // regardless of whether any component is currently subscribed. This test
  // is the closest equivalent: fire a toast's timer with nobody "watching".
  it('a toast that is manually dismissed before its timer fires does not throw when the timer later runs, and does not affect a newer toast', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    const staleId = useToastStore.getState().toasts[0].id
    useToastStore.getState().dismissToast(staleId)

    useToastStore.getState().pushToast({ icon: '2', title: 'two' })

    expect(() => vi.advanceTimersByTime(3200)).not.toThrow()
    // Both timers (the dismissed toast's now-stale one, and the second
    // toast's real one) have fired by 3200ms; the store ends up empty and
    // clean either way.
    expect(useToastStore.getState().toasts).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('max visible toasts (task 2 — MAX_VISIBLE_TOASTS)', () => {
  it('never keeps more than MAX_VISIBLE_TOASTS toasts on screen', () => {
    for (let i = 0; i < MAX_VISIBLE_TOASTS + 2; i++) {
      useToastStore.getState().pushToast({ icon: 'x', title: `toast-${i}` })
    }
    expect(useToastStore.getState().toasts).toHaveLength(MAX_VISIBLE_TOASTS)
  })

  it('evicts the oldest toast first and keeps the newest N in order', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    useToastStore.getState().pushToast({ icon: '2', title: 'two' })
    useToastStore.getState().pushToast({ icon: '3', title: 'three' })
    useToastStore.getState().pushToast({ icon: '4', title: 'four' }) // evicts 'one'
    expect(useToastStore.getState().toasts.map((toast) => toast.title)).toEqual(['two', 'three', 'four'])
  })

  it('does not touch reward/points logic — pushToast never returns a value the caller could branch reward logic on', () => {
    // The cap only ever trims the *display* array; every real call site
    // (dailyQuestStore.claimQuest, seasonStore.claimMoonlightReward,
    // shopStore.purchaseWithPoints, ...) has already committed the actual
    // reward via its own store before pushToast is even called, so there is
    // no return value here that could plausibly be used to undo one.
    const result = useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    expect(result).toBeUndefined()
  })

  it('manual dismiss and auto-dismiss both still work normally once the cap is in effect', () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < MAX_VISIBLE_TOASTS + 1; i++) {
        useToastStore.getState().pushToast({ icon: 'x', title: `toast-${i}` })
      }
      const [oldestVisible] = useToastStore.getState().toasts
      useToastStore.getState().dismissToast(oldestVisible.id)
      expect(useToastStore.getState().toasts).toHaveLength(MAX_VISIBLE_TOASTS - 1)

      vi.advanceTimersByTime(3200)
      expect(useToastStore.getState().toasts).toHaveLength(0)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
})

describe('persistence', () => {
  it('is not wrapped in zustand persist — no localStorage key, no rehydration surface', () => {
    // zustand's `persist` middleware attaches a `.persist` object (rehydrate/
    // clearStorage/etc.) to the store hook itself; a plain `create()` store
    // like this one has no such property. Checked at the hook level instead
    // of via a real `localStorage` global because this project's vitest
    // environment is `node`, which doesn't provide one.
    expect((useToastStore as unknown as { persist?: unknown }).persist).toBeUndefined()
  })
})
