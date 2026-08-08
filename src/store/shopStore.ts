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
  { id: 'hair-ribbon', category: 'hair', name: '리본 헤어핀', priceType: 'points', price: 30, emoji: '🎀' },
  { id: 'hair-straw', category: 'hair', name: '밀짚모자', priceType: 'points', price: 50, emoji: '👒' },
  { id: 'hair-cap', category: 'hair', name: '야구모자', priceType: 'cash', price: 1500, emoji: '🧢' },

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
    { name: 'studylog-shop' },
  ),
)
