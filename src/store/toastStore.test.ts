import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateToastId, MAX_VISIBLE_TOASTS, useToastStore } from './toastStore'

const INITIAL_STATE = useToastStore.getState()

// Fake timers for the whole file, not just the describe blocks that assert
// on timing: `pushToast` schedules a real 3.2s auto-dismiss `setTimeout` on
// every single call, so any test that pushes a toast without fake timers
// active leaves a genuine pending timer running past the end of that test.
// One global on/off pair — cleared and torn down after every test — is what
// actually guarantees zero pending timers once the whole file finishes,
// not just the tests that were about timing specifically.
beforeEach(() => {
  vi.useFakeTimers()
  useToastStore.setState(INITIAL_STATE, true)
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('generateToastId', () => {
  // This is the real uniqueness guarantee — sampling ids off the store
  // after many `pushToast` calls would only ever see the last
  // `MAX_VISIBLE_TOASTS` survivors, since older toasts get evicted. Calling
  // the id generator directly is the only way to check *every* id it ever
  // produced, not just whichever ones happened to still be visible.
  it('produces a unique id on every call across a large, unbounded sample', () => {
    const ids = Array.from({ length: 10_000 }, () => generateToastId())
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('stays unique even when Date.now() and Math.random() are both pinned to the exact same value on every call', () => {
    // The pathological case named in the task: proves uniqueness doesn't
    // rest on probability (a fixed random value repeating is "supposed to
    // be" astronomically unlikely) — the monotonic counter makes it
    // impossible regardless, deterministically, not just improbable.
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789)

    const ids = Array.from({ length: 500 }, () => generateToastId())

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every id is a non-empty string', () => {
    const id = generateToastId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })
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

  it('the currently-visible toasts always carry distinct ids (integration check, not the uniqueness proof — see generateToastId above)', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' })
    useToastStore.getState().pushToast({ icon: '2', title: 'two' })
    useToastStore.getState().pushToast({ icon: '3', title: 'three' })
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

describe('auto-dismiss timer', () => {
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

describe('max visible toasts (MAX_VISIBLE_TOASTS)', () => {
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

  it('the auto-dismiss timer of a toast evicted by the cap still fires safely, with no effect on the toasts that replaced it', () => {
    useToastStore.getState().pushToast({ icon: '1', title: 'one' }) // will be evicted below
    for (let i = 2; i <= MAX_VISIBLE_TOASTS + 1; i++) {
      useToastStore.getState().pushToast({ icon: String(i), title: `t${i}` })
    }
    expect(useToastStore.getState().toasts.map((toast) => toast.title)).not.toContain('one')

    // 'one'’s own setTimeout (scheduled back when it was pushed) fires here,
    // trying to dismiss an id the store no longer has — must be a safe no-op.
    expect(() => vi.advanceTimersByTime(3200)).not.toThrow()
    expect(useToastStore.getState().toasts).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('manual dismiss and auto-dismiss both still work normally once the cap is in effect', () => {
    for (let i = 0; i < MAX_VISIBLE_TOASTS + 1; i++) {
      useToastStore.getState().pushToast({ icon: 'x', title: `toast-${i}` })
    }
    const [oldestVisible] = useToastStore.getState().toasts
    useToastStore.getState().dismissToast(oldestVisible.id)
    expect(useToastStore.getState().toasts).toHaveLength(MAX_VISIBLE_TOASTS - 1)

    vi.advanceTimersByTime(3200)
    expect(useToastStore.getState().toasts).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
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
