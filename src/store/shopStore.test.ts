import { beforeEach, describe, expect, it } from 'vitest'
import { mergeShopPersistedState, SHOP_ITEMS, useShopStore } from './shopStore'
import { usePointsStore } from './pointsStore'

/**
 * Direct tests of the EXISTING shop store's purchase/equip/persist
 * invariants (docs/StudyLog_Cosmetic_System_PRD_v1.0.md §14 "Store/domain").
 * No behavior here changes with the Phase 1 cosmetic-domain work
 * (src/cosmetics/) — these tests exist to prove that's true and to lock the
 * baseline in place before any later phase touches rendering.
 */

const INITIAL_SHOP_STATE = useShopStore.getState()
const INITIAL_POINTS_STATE = usePointsStore.getState()

beforeEach(() => {
  useShopStore.setState(INITIAL_SHOP_STATE, true)
  usePointsStore.setState(INITIAL_POINTS_STATE, true)
  usePointsStore.getState().earn(1000, 'test setup')
})

describe('purchaseWithPoints', () => {
  it('spends exactly the listed points once', () => {
    const before = usePointsStore.getState().balance()
    useShopStore.getState().purchaseWithPoints('hair-ribbon')
    expect(usePointsStore.getState().balance()).toBe(before - 30) // hair-ribbon price
  })

  it('adds the item to ownedItemIds and auto-equips it in its category', () => {
    useShopStore.getState().purchaseWithPoints('acc-glasses')
    expect(useShopStore.getState().ownedItemIds).toContain('acc-glasses')
    expect(useShopStore.getState().equipped.accessory).toBe('acc-glasses')
  })

  it('fails and makes no changes for a cash-only item', () => {
    const before = useShopStore.getState()
    const ok = useShopStore.getState().purchaseWithPoints('hair-cap') // cash item
    expect(ok).toBe(false)
    expect(useShopStore.getState()).toEqual(before)
  })

  it('fails and makes no changes when the item is already owned', () => {
    useShopStore.getState().purchaseWithPoints('hair-ribbon')
    const afterFirst = useShopStore.getState()
    const pointsAfterFirst = usePointsStore.getState().balance()

    const ok = useShopStore.getState().purchaseWithPoints('hair-ribbon')

    expect(ok).toBe(false)
    expect(useShopStore.getState()).toEqual(afterFirst)
    expect(usePointsStore.getState().balance()).toBe(pointsAfterFirst)
  })

  it('fails and spends nothing when the balance is insufficient', () => {
    usePointsStore.setState(INITIAL_POINTS_STATE, true) // no bonus earn this time — balance 0
    const ok = useShopStore.getState().purchaseWithPoints('hair-ribbon')
    expect(ok).toBe(false)
    expect(useShopStore.getState().ownedItemIds).toEqual([])
  })
})

describe('equipItem', () => {
  it('cannot equip an item that is not owned', () => {
    useShopStore.getState().equipItem('hair-ribbon')
    expect(useShopStore.getState().equipped.hair).toBeUndefined()
  })

  it('equipping a second item in the same category replaces only that category', () => {
    useShopStore.getState().purchaseWithPoints('hair-ribbon')
    useShopStore.getState().purchaseWithPoints('acc-glasses')
    useShopStore.getState().purchaseWithPoints('hair-straw')
    useShopStore.getState().equipItem('hair-straw')

    expect(useShopStore.getState().equipped.hair).toBe('hair-straw')
    expect(useShopStore.getState().equipped.accessory).toBe('acc-glasses') // untouched
  })
})

describe('unequipCategory', () => {
  it('preserves ownership after unequipping', () => {
    useShopStore.getState().purchaseWithPoints('hair-ribbon')
    useShopStore.getState().unequipCategory('hair')

    expect(useShopStore.getState().equipped.hair).toBeUndefined()
    expect(useShopStore.getState().ownedItemIds).toContain('hair-ribbon')
  })
})

describe('hairColor category (required test 1/2 — docs/Claude_Black_Hair_Whole_Avatar_Implementation_Prompt.md)', () => {
  it('is independent from the existing hair accessory category — equipping both at once is possible', () => {
    useShopStore.getState().purchaseWithPoints('hair-ribbon') // category: hair
    useShopStore.getState().purchaseWithPoints('hair-color-black') // category: hairColor

    expect(useShopStore.getState().equipped.hair).toBe('hair-ribbon')
    expect(useShopStore.getState().equipped.hairColor).toBe('hair-color-black')
  })

  it('unequipping hairColor never touches the hair category, and vice versa', () => {
    useShopStore.getState().purchaseWithPoints('hair-ribbon')
    useShopStore.getState().purchaseWithPoints('hair-color-black')

    useShopStore.getState().unequipCategory('hairColor')
    expect(useShopStore.getState().equipped.hairColor).toBeUndefined()
    expect(useShopStore.getState().equipped.hair).toBe('hair-ribbon') // untouched

    useShopStore.getState().unequipCategory('hair')
    expect(useShopStore.getState().equipped.hair).toBeUndefined()
  })

  it('can be purchased, spending exactly the listed points once', () => {
    const before = usePointsStore.getState().balance()
    const ok = useShopStore.getState().purchaseWithPoints('hair-color-black')
    expect(ok).toBe(true)
    expect(usePointsStore.getState().balance()).toBe(before - 30)
    expect(useShopStore.getState().ownedItemIds).toContain('hair-color-black')
  })

  it('auto-equips on purchase, and can be explicitly equipped/unequipped afterward', () => {
    useShopStore.getState().purchaseWithPoints('hair-color-black')
    expect(useShopStore.getState().equipped.hairColor).toBe('hair-color-black')

    useShopStore.getState().unequipCategory('hairColor')
    expect(useShopStore.getState().equipped.hairColor).toBeUndefined()

    useShopStore.getState().equipItem('hair-color-black')
    expect(useShopStore.getState().equipped.hairColor).toBe('hair-color-black')
  })

  it('cannot be equipped before purchase', () => {
    useShopStore.getState().equipItem('hair-color-black')
    expect(useShopStore.getState().equipped.hairColor).toBeUndefined()
  })

  it('survives a JSON round-trip (the shop\'s persisted shape) once purchased and equipped', () => {
    useShopStore.getState().purchaseWithPoints('hair-color-black')
    const shape = {
      ownedItemIds: useShopStore.getState().ownedItemIds,
      equipped: useShopStore.getState().equipped,
    }
    const roundTripped = JSON.parse(JSON.stringify(shape))
    expect(roundTripped).toEqual(shape)
    expect(roundTripped.equipped.hairColor).toBe('hair-color-black')
  })
})

describe('persisted-state shape is JSON-safe (NOT a real rehydration test)', () => {
  // This only proves ownedItemIds/equipped contain no value JSON can't
  // round-trip (a Map, a Set, undefined-in-an-array, etc.) — it does not
  // exercise zustand's `persist` middleware, localStorage, or actual
  // rehydration on reload. This project's vitest environment is `node`
  // (vite.config.ts — "Pure-logic unit tests only, no DOM rendering"), and
  // `persist` needs a `localStorage`-like Storage, which Node doesn't
  // provide, so a genuine rehydration test needs a jsdom (or browser-mode)
  // environment.
  //
  // TODO(storage-migration phase): when a real Zustand version/migration
  // is introduced for this store (docs/StudyLog_Cosmetic_System_PRD_v1.0.md
  // §6 "Use a versioned Zustand migration"), add a jsdom-backed test that
  // writes a `studylog-shop` payload to a real `localStorage`, calls
  // `useShopStore.persist.rehydrate()`, and asserts the live store state —
  // that is the only way to prove hydration itself (not just the data
  // shape) works, including the migration function.
  it('ownedItemIds and equipped survive a JSON.stringify/JSON.parse round-trip unchanged', () => {
    useShopStore.getState().purchaseWithPoints('hair-ribbon')
    useShopStore.getState().purchaseWithPoints('acc-glasses')

    const shape = {
      ownedItemIds: useShopStore.getState().ownedItemIds,
      equipped: useShopStore.getState().equipped,
    }
    const roundTripped = JSON.parse(JSON.stringify(shape))

    expect(roundTripped).toEqual(shape)
  })
})

describe('persist merge — mergeShopPersistedState (fix: prevent stale shop loading state on rehydrate)', () => {
  // The real `currentState` zustand's persist middleware would hand to
  // `merge` on load: a freshly-initialized store (real action functions,
  // real live SHOP_ITEMS, checkoutLoading false).
  const freshCurrentState = useShopStore.getState()

  it('required test 1 — an old persisted checkoutLoading: true is restored as false', () => {
    const staleBlob = { checkoutLoading: true }
    const merged = mergeShopPersistedState(staleBlob, freshCurrentState)
    expect(merged.checkoutLoading).toBe(false)
  })

  it('required test 2 — a stale persisted items array never overrides the live SHOP_ITEMS catalog', () => {
    const oldTenItemBlob = { items: SHOP_ITEMS.slice(0, 3) } // e.g. a blob saved before hair-color-black existed
    const merged = mergeShopPersistedState(oldTenItemBlob, freshCurrentState)
    expect(merged.items).toBe(freshCurrentState.items)
    expect(merged.items).toHaveLength(SHOP_ITEMS.length)
  })

  it('required test 3 — ownedItemIds restores correctly from persisted state', () => {
    const persisted = { ownedItemIds: ['hair-ribbon', 'acc-glasses'] }
    const merged = mergeShopPersistedState(persisted, freshCurrentState)
    expect(merged.ownedItemIds).toEqual(['hair-ribbon', 'acc-glasses'])
  })

  it('required test 4 — equipped.hairColor restores correctly from persisted state', () => {
    const persisted = { equipped: { hairColor: 'hair-color-black', hair: 'hair-ribbon' } }
    const merged = mergeShopPersistedState(persisted, freshCurrentState)
    expect(merged.equipped.hairColor).toBe('hair-color-black')
    expect(merged.equipped.hair).toBe('hair-ribbon')
  })

  it('required test 5 — adWatchesToday restores correctly from persisted state', () => {
    const persisted = { adWatchesToday: 2 }
    const merged = mergeShopPersistedState(persisted, freshCurrentState)
    expect(merged.adWatchesToday).toBe(2)
  })

  it('required test 6 — hair-color-black is present in the merged shop for an existing user with old stored data', () => {
    // Simulates the exact bug this whole fix line was found under: a
    // pre-hair-color-black persisted blob merged against the current
    // (post-hair-color-black) build.
    const oldUserBlob = {
      ownedItemIds: ['hair-ribbon'],
      equipped: { hair: 'hair-ribbon' },
      adWatchesToday: 1,
      items: SHOP_ITEMS.filter((i) => i.id !== 'hair-color-black'),
    }
    const merged = mergeShopPersistedState(oldUserBlob, freshCurrentState)
    expect(merged.items.some((i) => i.id === 'hair-color-black')).toBe(true)
  })

  it('combines a realistic full old blob correctly: stale items/checkoutLoading dropped, user data kept', () => {
    const realisticOldBlob = {
      items: SHOP_ITEMS.slice(0, 2),
      ownedItemIds: ['hair-ribbon', 'hair-color-black'],
      equipped: { hair: 'hair-ribbon', hairColor: 'hair-color-black' },
      adWatchesToday: 3,
      checkoutLoading: true,
    }
    const merged = mergeShopPersistedState(realisticOldBlob, freshCurrentState)

    expect(merged.checkoutLoading).toBe(false)
    expect(merged.items).toBe(freshCurrentState.items)
    expect(merged.ownedItemIds).toEqual(['hair-ribbon', 'hair-color-black'])
    expect(merged.equipped).toEqual({ hair: 'hair-ribbon', hairColor: 'hair-color-black' })
    expect(merged.adWatchesToday).toBe(3)
  })

  it('falls back to currentState defaults when persistedState is empty (first-ever visit)', () => {
    const merged = mergeShopPersistedState({}, freshCurrentState)
    expect(merged.checkoutLoading).toBe(false)
    expect(merged.items).toBe(freshCurrentState.items)
    expect(merged.ownedItemIds).toEqual(freshCurrentState.ownedItemIds)
  })
})

describe('unknown legacy item id (an id that no longer exists in SHOP_ITEMS)', () => {
  it('does not crash any store action and is not silently stripped from ownedItemIds', () => {
    useShopStore.setState({ ownedItemIds: ['legacy-removed-item'], equipped: {} })

    expect(() => useShopStore.getState().equipItem('legacy-removed-item')).not.toThrow()
    expect(() => useShopStore.getState().purchaseWithPoints('hair-ribbon')).not.toThrow()
    // equipItem is a no-op for an id with no catalog entry (findCatalogEntry
    // returns undefined), so it correctly never gets equipped — but it must
    // still be there, untouched, in ownedItemIds.
    expect(useShopStore.getState().ownedItemIds).toContain('legacy-removed-item')
  })
})
