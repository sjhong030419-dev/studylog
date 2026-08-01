import { useState } from 'react'
import { CharacterView } from '../../character/components/CharacterView'
import { isShopItemPngSupported } from '../../character/engine/spriteSupport'
import { useMyAvatarAppearance } from '../../hooks/useMyAvatarAppearance'
import { useProfileStore } from '../../store/profileStore'
import { usePointsStore } from '../../store/pointsStore'
import { AD_BONUS_POINTS, AD_DAILY_LIMIT, useShopStore } from '../../store/shopStore'
import { readableInkColor } from '../../utils/contrastColor'
import type { ShopCategory } from '../../types'

const CATEGORY_LABEL: Record<ShopCategory, string> = {
  hair: '헤어',
  outfit: '옷',
  accessory: '액세서리',
  background: '배경',
}

const CATEGORIES: ShopCategory[] = ['hair', 'outfit', 'accessory', 'background']

export function AvatarShop() {
  const items = useShopStore((s) => s.items)
  const ownedItemIds = useShopStore((s) => s.ownedItemIds)
  const equipped = useShopStore((s) => s.equipped)
  const adWatchesToday = useShopStore((s) => s.adWatchesToday)
  const checkoutLoading = useShopStore((s) => s.checkoutLoading)
  const purchaseWithPoints = useShopStore((s) => s.purchaseWithPoints)
  const purchaseWithCash = useShopStore((s) => s.purchaseWithCash)
  const equipItem = useShopStore((s) => s.equipItem)
  const unequipCategory = useShopStore((s) => s.unequipCategory)
  const watchAdForBonus = useShopStore((s) => s.watchAdForBonus)

  const balance = usePointsStore((s) => s.balance())
  const gender = useProfileStore((s) => s.gender)
  const appearance = useMyAvatarAppearance()

  const [category, setCategory] = useState<ShopCategory>('hair')

  const categoryItems = items.filter((i) => i.category === category)

  async function handleBuy(itemId: string, priceType: 'points' | 'cash') {
    if (priceType === 'points') {
      purchaseWithPoints(itemId)
    } else {
      await purchaseWithCash(itemId)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">아바타 상점 🛍️</h1>

      <div
        className="backdrop-blur rounded-3xl shadow-lg px-8 py-6 flex flex-col items-center gap-2"
        style={{ backgroundColor: appearance.backgroundColor ?? 'rgba(255,255,255,0.7)' }}
      >
        <CharacterView state="happy" gender={gender} appearance={appearance} size={120} />
        <span
          className="font-pixel text-sm"
          style={{ color: readableInkColor(appearance.backgroundColor, 'var(--color-ink)') }}
        >
          보유 {balance}P
        </span>
      </div>

      <button
        type="button"
        onClick={watchAdForBonus}
        disabled={adWatchesToday >= AD_DAILY_LIMIT || checkoutLoading}
        className="font-cute text-xs px-4 py-2 rounded-full bg-pastel-mint text-ink shadow disabled:opacity-50"
      >
        {checkoutLoading
          ? '광고 재생 중...'
          : `📺 광고 보고 +${AD_BONUS_POINTS}P 받기 (오늘 ${adWatchesToday}/${AD_DAILY_LIMIT})`}
      </button>

      <div className="flex gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`font-cute px-3 py-1.5 rounded-full border text-sm ${
              category === c ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        {categoryItems.map((item) => {
          const owned = ownedItemIds.includes(item.id)
          const isEquipped = equipped[item.category] === item.id
          // Shown regardless of owned/equipped — cash items exist, so a
          // buyer must see this BEFORE purchasing, not only after equipping
          // (character/engine/spriteSupport.ts is the single source of truth).
          const isPngSupported = isShopItemPngSupported(item.id)
          return (
            <div
              key={item.id}
              className={`rounded-2xl px-3 py-3 shadow-sm flex flex-col items-center gap-1.5 ${
                isEquipped ? 'bg-pastel-yellow' : 'bg-white/70'
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-cute text-ink text-xs text-center">{item.name}</span>
              <span className="font-pixel text-[10px] text-ink-soft">
                {item.priceType === 'points' ? `${item.price}P` : `₩${item.price.toLocaleString()}`}
              </span>
              {!isPngSupported && (
                <span className="font-cute text-[9px] px-2 py-0.5 rounded-full bg-ink/10 text-ink-soft text-center">
                  새 캐릭터 대응 준비 중
                </span>
              )}

              {owned ? (
                // Already-owned items stay fully equippable/unequippable
                // regardless of PNG support — nothing about owned purchase
                // or equip data is ever blocked, only NEW purchases are.
                <button
                  type="button"
                  onClick={() => (isEquipped ? unequipCategory(item.category) : equipItem(item.id))}
                  className={`font-cute text-[11px] px-3 py-1 rounded-full w-full ${
                    isEquipped ? 'bg-ink text-white' : 'bg-white border border-ink/20 text-ink'
                  }`}
                >
                  {isEquipped ? '착용중' : '착용하기'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBuy(item.id, item.priceType)}
                  disabled={
                    checkoutLoading || !isPngSupported || (item.priceType === 'points' && balance < item.price)
                  }
                  className="font-cute text-[11px] px-3 py-1 rounded-full bg-pastel-lavender text-ink w-full disabled:opacity-50"
                >
                  구매하기
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-ink-soft text-xs font-cute text-center max-w-sm">
        캐시 아이템은 Stripe 테스트 모드 구조로 연결돼 있어요. 실제 결제는 발생하지 않습니다.
      </p>
    </div>
  )
}
