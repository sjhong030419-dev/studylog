import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ShopCategory, ShopItem } from '../types'
import { apiUrl } from '../utils/apiBase'
import { usePointsStore } from './pointsStore'

export const AD_BONUS_POINTS = 5
export const AD_DAILY_LIMIT = 3

// Exported (not just used internally) so the new cosmetic-domain adapter
// (src/cosmetics/) can derive its catalog from the one real source of
// truth without going through a React hook — this is a read-only export,
// nothing about how the store itself uses this array changes.
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'skin-sakura-uniform-girl',
    category: 'skin',
    name: '벚꽃 교복 학생',
    priceType: 'points',
    price: 120,
    emoji: '🌸',
    colorHex: '#C97886',
  },
  {
    id: 'skin-moonlight-academy',
    category: 'skin',
    name: '달빛 아카데미',
    priceType: 'points',
    price: 180,
    emoji: '🌙',
    colorHex: '#242847',
  },
  { id: 'hair-ribbon', category: 'hair', name: '벚꽃 리본 · 교복 전용', priceType: 'points', price: 30, emoji: '🎀' },
  { id: 'hair-straw', category: 'hair', name: '밀짚모자', priceType: 'points', price: 50, emoji: '👒' },
  { id: 'hair-cap', category: 'hair', name: '야구모자', priceType: 'cash', price: 1500, emoji: '🧢' },

  // Whole-avatar hair color — a complete baked character image swap
  // (character/engine/wholeAvatarSupport.ts), not a layered cosmetic.
  // Girl-only today (public/sprites/avatar/whole/black-hair/) — see
  // AvatarShop.tsx for the boy-gender pending UX this requires.
  { id: 'hair-color-black', category: 'hairColor', name: '검정머리', priceType: 'points', price: 30, emoji: '⚫', colorHex: '#1B1A21' },

  { id: 'outfit-blue', category: 'outfit', name: '파란 니트', priceType: 'points', price: 40, emoji: '🔵', colorHex: '#a8d8ff' },
  { id: 'outfit-pink', category: 'outfit', name: '핑크 원피스', priceType: 'points', price: 40, emoji: '🌸', colorHex: '#ffd6e8' },
  { id: 'outfit-gold', category: 'outfit', name: '골드 후드', priceType: 'cash', price: 2000, emoji: '✨', colorHex: '#ffe082' },

  { id: 'acc-glasses', category: 'accessory', name: '동그란 안경', priceType: 'points', price: 20, emoji: '👓' },
  { id: 'acc-headphone', category: 'accessory', name: '헤드폰', priceType: 'points', price: 35, emoji: '🎧' },
  { id: 'acc-necklace', category: 'accessory', name: '별 목걸이', priceType: 'cash', price: 1200, emoji: '💎' },

  { id: 'bg-sky', category: 'background', name: '파스텔 하늘', priceType: 'points', price: 25, emoji: '☁️', colorHex: '#d3ebff' },
  { id: 'bg-night', category: 'background', name: '별 헤는 밤', priceType: 'points', price: 25, emoji: '🌙', colorHex: '#2d2a4a' },
  { id: 'bg-sakura', category: 'background', name: '벚꽃 배경', priceType: 'cash', price: 1000, emoji: '🌸', colorHex: '#ffe3ee' },
]

interface ShopState {
  items: ShopItem[]
  ownedItemIds: string[]
  equipped: Partial<Record<ShopCategory, string>>
  adWatchesToday: number
  checkoutLoading: boolean

  purchaseWithPoints: (itemId: string) => boolean
  purchaseWithCash: (itemId: string) => Promise<boolean>
  equipItem: (itemId: string) => void
  unequipCategory: (category: ShopCategory) => void
  watchAdForBonus: () => Promise<boolean>
}

/**
 * Zustand's `persist` `merge` option, pulled out as a standalone pure
 * function so the rehydration behavior itself is unit-testable (rather than
 * only reachable by mounting the whole store) — see shopStore.test.ts's
 * "persist merge" suite.
 *
 * Both `items` and `checkoutLoading` are runtime-only fields that must never
 * come from a stored blob, old or new: `items` for the reason already
 * documented on `partialize` below, and `checkoutLoading` because a stored
 * `true` (an in-flight cash checkout interrupted by a closed tab/browser
 * crash before `purchaseWithCash`'s `finally` block ran) would otherwise
 * survive rehydration and permanently disable the purchase button — the
 * button being disabled is exactly what would have "self-corrected" it on
 * the next purchase attempt, so that never happens on its own. Every other
 * field (ownedItemIds/equipped/adWatchesToday) is real user data and must
 * still restore from `persistedState` normally.
 */
export function mergeShopPersistedState(persistedState: unknown, currentState: ShopState): ShopState {
  return {
    ...currentState,
    ...(persistedState as Partial<ShopState>),
    items: currentState.items,
    checkoutLoading: currentState.checkoutLoading,
  }
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      items: SHOP_ITEMS,
      ownedItemIds: [],
      equipped: {},
      adWatchesToday: 0,
      checkoutLoading: false,

      purchaseWithPoints: (itemId) => {
        const item = get().items.find((i) => i.id === itemId)
        if (!item || item.priceType !== 'points') return false
        if (get().ownedItemIds.includes(itemId)) return false
        const ok = usePointsStore.getState().spend(item.price, `상점 구매: ${item.name}`)
        if (!ok) return false
        set({
          ownedItemIds: [...get().ownedItemIds, itemId],
          equipped: { ...get().equipped, [item.category]: itemId },
        })
        return true
      },

      purchaseWithCash: async (itemId) => {
        const item = get().items.find((i) => i.id === itemId)
        if (!item || item.priceType !== 'cash') return false
        if (get().ownedItemIds.includes(itemId)) return false

        set({ checkoutLoading: true })
        try {
          const res = await fetch(apiUrl('/api/checkout/create-session'), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ itemId: item.id, itemName: item.name, priceKrw: item.price }),
          })
          const data = await res.json()

          if (data.mock && data.status === 'succeeded') {
            set({
              ownedItemIds: [...get().ownedItemIds, itemId],
              equipped: { ...get().equipped, [item.category]: itemId },
            })
            return true
          }

          if (data.url) {
            window.location.href = data.url
            return true
          }

          return false
        } catch {
          return false
        } finally {
          set({ checkoutLoading: false })
        }
      },

      equipItem: (itemId) => {
        const item = get().items.find((i) => i.id === itemId)
        if (!item || !get().ownedItemIds.includes(itemId)) return
        set({ equipped: { ...get().equipped, [item.category]: itemId } })
      },

      unequipCategory: (category) => {
        const next = { ...get().equipped }
        delete next[category]
        set({ equipped: next })
      },

      watchAdForBonus: async () => {
        if (get().adWatchesToday >= AD_DAILY_LIMIT) return false
        set({ checkoutLoading: true })
        await new Promise((resolve) => setTimeout(resolve, 1500))
        usePointsStore.getState().earn(AD_BONUS_POINTS, '광고 시청 보너스')
        set({ adWatchesToday: get().adWatchesToday + 1, checkoutLoading: false })
        return true
      },
    }),
    {
      name: 'studylog-shop',
      // `items` is the live catalog (SHOP_ITEMS above), not user data — it
      // must never be persisted or restored. `partialize` stops it from
      // being WRITTEN to storage going forward; that alone isn't enough,
      // because any browser that already has a `studylog-shop` entry saved
      // from before this fix still has an `items` array frozen at
      // whatever the catalog looked like on that user's first visit —
      // zustand's default `merge` would layer that stale array on top of
      // the fresh one on every load. `merge` below forces `items` to always
      // come from the freshly-initialized state instead, so both an old
      // stored blob and a new one behave the same way. (Found and fixed
      // while implementing this feature: hair-color-black silently didn't
      // appear in the shop for any browser with pre-existing shop data
      // until this was added — not a pre-existing known issue.)
      // `checkoutLoading` is transient UI state, excluded from `partialize`
      // for the same "never persisted" reason. `merge` (mergeShopPersistedState
      // above) also forces it back to `false` on every rehydrate — a stored
      // `true` (from an interrupted cash checkout) would otherwise disable
      // the purchase button permanently, since a disabled button can't be
      // clicked to trigger the "next attempt" that would have reset it.
      partialize: (state) => ({
        ownedItemIds: state.ownedItemIds,
        equipped: state.equipped,
        adWatchesToday: state.adWatchesToday,
      }),
      merge: mergeShopPersistedState,
    },
  ),
)
