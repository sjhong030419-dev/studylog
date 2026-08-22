import { useState } from 'react'
import { CharacterView } from '../../character/components/CharacterView'
import { isShopItemPngSupported } from '../../character/engine/spriteSupport'
import { isWholeAvatarItemSupportedForGender } from '../../character/engine/wholeAvatarSupport'
import { useMyAvatarAppearance } from '../../hooks/useMyAvatarAppearance'
import { useProfileStore } from '../../store/profileStore'
import { usePointsStore } from '../../store/pointsStore'
import { AD_BONUS_POINTS, AD_DAILY_LIMIT, useShopStore } from '../../store/shopStore'
import { readableInkColor } from '../../utils/contrastColor'
import { buildPreviewEquipped, resolveAvatarAppearance } from '../../utils/avatarAppearance'
import { useToastStore } from '../../store/toastStore'
import type { ShopCategory, ShopItem } from '../../types'
import { MoonlightSeasonCard } from './MoonlightSeasonCard'

const CATEGORY_LABEL: Record<ShopCategory, string> = {
  skin: '스킨',
  hair: '헤어',
  hairColor: '머리색',
  outfit: '옷',
  accessory: '액세서리',
  background: '배경',
}

const CATEGORIES: ShopCategory[] = ['skin', 'hair', 'hairColor', 'outfit', 'accessory', 'background']

type ShopView = 'shop' | 'wardrobe'
type CategoryFilter = ShopCategory | 'all'

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
  const pushToast = useToastStore((s) => s.pushToast)

  const [view, setView] = useState<ShopView>('shop')
  const [category, setCategory] = useState<CategoryFilter>('skin')
  const [previewItemId, setPreviewItemId] = useState<string | null>(null)

  const previewItem = items.find((item) => item.id === previewItemId)
  const previewAppearance = previewItem
    ? resolveAvatarAppearance(items, buildPreviewEquipped(equipped, previewItem))
    : appearance

  const visibleItems = items.filter((item) => {
    if (view === 'wardrobe' && !ownedItemIds.includes(item.id)) return false
    return category === 'all' || item.category === category
  })

  function changeView(nextView: ShopView) {
    setView(nextView)
    setCategory(nextView === 'wardrobe' ? 'all' : 'skin')
    setPreviewItemId(null)
  }

  function changeCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory)
    setPreviewItemId(null)
  }

  async function handleBuy(item: ShopItem) {
    const ok = item.priceType === 'points' ? purchaseWithPoints(item.id) : await purchaseWithCash(item.id)
    if (!ok) return
    setPreviewItemId(null)
    // A cash purchase can still resolve `true` while only having redirected
    // to a checkout page (`window.location.href = data.url`, shopStore.ts) —
    // showing "구매 완료" then would be premature, so only the mock-success
    // path (same-tab, item already owned) gets a toast; a real redirect
    // never sees the "buy" screen's toast host again before it leaves.
    if (item.priceType === 'cash' && !useShopStore.getState().ownedItemIds.includes(item.id)) return
    pushToast({ icon: item.emoji, title: '구매 완료!', subtitle: item.name })
  }

  return (
    <main className="min-h-screen px-4 pb-32 pt-6">
      <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-4">
      <div className="w-full text-left">
        <p className="font-cute text-[11px] tracking-wide text-ink-soft">MAKE IT YOUR CHARACTER</p>
        <h1 className="font-cute text-3xl text-ink">{view === 'shop' ? '아바타 상점 🛍️' : '내 옷장 👗'}</h1>
        <p className="mt-1 font-cute text-xs text-ink-soft">미리 입어보고, 모으고, 모든 공부 화면에 같은 모습으로 적용해요.</p>
      </div>

      {view === 'shop' && <MoonlightSeasonCard />}

      <div className="flex w-full max-w-sm rounded-2xl bg-white/70 p-1 shadow-sm" aria-label="아바타 메뉴">
        <button
          type="button"
          onClick={() => changeView('shop')}
          aria-pressed={view === 'shop'}
          className={`flex-1 rounded-xl px-4 py-2 font-cute text-sm transition-colors ${
            view === 'shop' ? 'bg-ink text-white shadow-sm' : 'text-ink-soft'
          }`}
        >
          상점
        </button>
        <button
          type="button"
          onClick={() => changeView('wardrobe')}
          aria-pressed={view === 'wardrobe'}
          className={`flex-1 rounded-xl px-4 py-2 font-cute text-sm transition-colors ${
            view === 'wardrobe' ? 'bg-ink text-white shadow-sm' : 'text-ink-soft'
          }`}
        >
          내 옷장 ({ownedItemIds.length})
        </button>
      </div>

      <div
        className="w-full backdrop-blur rounded-[26px] border border-white/80 shadow-[0_14px_35px_rgba(108,82,130,0.12)] px-8 py-6 flex flex-col items-center gap-2"
        style={{ backgroundColor: previewAppearance.backgroundColor ?? 'rgba(255,255,255,0.7)' }}
      >
        {previewItem && (
          <div className="flex items-center gap-2 rounded-full bg-pastel-yellow px-3 py-1 font-cute text-[11px] text-ink">
            <span>미리보기 · {previewItem.name}</span>
            <button type="button" onClick={() => setPreviewItemId(null)} className="font-pixel text-xs" aria-label="미리보기 닫기">
              ×
            </button>
          </div>
        )}
        <CharacterView state="happy" gender={gender} appearance={previewAppearance} size={120} />
        <span
          className="font-pixel text-sm"
          style={{ color: readableInkColor(previewAppearance.backgroundColor, 'var(--color-ink)') }}
        >
          보유 {balance}P
        </span>
      </div>

      {view === 'shop' && (
        <button
          type="button"
          onClick={watchAdForBonus}
          disabled={adWatchesToday >= AD_DAILY_LIMIT || checkoutLoading}
          className="font-cute min-h-[44px] text-xs px-4 py-2 rounded-full bg-pastel-mint text-ink shadow disabled:opacity-50"
        >
          {checkoutLoading
            ? '광고 재생 중...'
            : `📺 광고 보고 +${AD_BONUS_POINTS}P 받기 (오늘 ${adWatchesToday}/${AD_DAILY_LIMIT})`}
        </button>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {view === 'wardrobe' && (
          <button
            type="button"
            onClick={() => changeCategory('all')}
            className={`font-cute min-h-[44px] px-3 py-1.5 rounded-full border text-sm ${
              category === 'all' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
            }`}
          >
            전체
          </button>
        )}
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => changeCategory(c)}
            className={`font-cute min-h-[44px] px-3 py-1.5 rounded-full border text-sm ${
              category === c ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        {visibleItems.map((item) => {
          const owned = ownedItemIds.includes(item.id)
          const isEquipped = equipped[item.category] === item.id
          const isWholeAvatarItem = item.category === 'hairColor' || item.category === 'skin'
          // Shown regardless of owned/equipped — cash items exist, so a
          // buyer must see this BEFORE purchasing, not only after equipping
          // (character/engine/spriteSupport.ts is the single source of truth).
          const isPngSupported = isShopItemPngSupported(item.id)
          // hairColor items are whole-avatar swaps (character/engine/
          // wholeAvatarSupport.ts), not layered cosmetics — isPngSupported
          // doesn't know about them at all (no CharacterAssetDefinition
          // exists for hair-color-black), so their support check is
          // separate and gender-specific: girl-only until boy art lands.
          const isGenderSupported = !isWholeAvatarItem || isWholeAvatarItemSupportedForGender(item.id, gender)
          const canPurchase = isPngSupported && isGenderSupported
          const canPreview = isPngSupported && isGenderSupported
          const isPreviewing = previewItemId === item.id
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
              {isWholeAvatarItem && (
                <span className="font-cute text-[9px] px-2 py-0.5 rounded-full bg-ink/10 text-ink-soft text-center">
                  남녀 캐릭터 지원
                </span>
              )}
              {isWholeAvatarItem && !isGenderSupported && (
                <span className="font-cute text-[9px] px-2 py-0.5 rounded-full bg-pastel-pink text-ink text-center">
                  지금은 남자 캐릭터라 적용되지 않아요
                </span>
              )}
              {!isWholeAvatarItem && !isPngSupported && (
                <span className="font-cute text-[9px] px-2 py-0.5 rounded-full bg-ink/10 text-ink-soft text-center">
                  새 캐릭터 대응 준비 중
                </span>
              )}

              <button
                type="button"
                onClick={() => setPreviewItemId(isPreviewing ? null : item.id)}
                disabled={!canPreview}
                aria-pressed={isPreviewing}
                className={`font-cute min-h-[44px] text-[11px] px-3 py-1 rounded-full w-full border disabled:opacity-40 ${
                  isPreviewing ? 'bg-pastel-yellow border-ink/20 text-ink' : 'bg-white border-ink/20 text-ink'
                }`}
              >
                {isPreviewing ? '미리보기 중' : '미리보기'}
              </button>

              {owned ? (
                // Already-owned items stay fully equippable/unequippable
                // regardless of PNG/gender support — nothing about owned
                // purchase or equip data is ever blocked, only NEW
                // purchases are. Equipping a girl-only hairColor item as a
                // boy is harmless: wholeAvatarSupport.ts's resolver falls
                // back to the safe default character.
                <button
                  type="button"
                  onClick={() => {
                    if (isEquipped) {
                      unequipCategory(item.category)
                      pushToast({ icon: item.emoji, title: '착용 해제', subtitle: item.name })
                    } else {
                      equipItem(item.id)
                      pushToast({ icon: item.emoji, title: '착용 완료!', subtitle: item.name })
                    }
                    setPreviewItemId(null)
                  }}
                  className={`font-cute min-h-[44px] text-[11px] px-3 py-1 rounded-full w-full ${
                    isEquipped ? 'bg-ink text-white' : 'bg-white border border-ink/20 text-ink'
                  }`}
                >
                  {isEquipped ? '✓ 착용중' : '착용하기'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBuy(item)}
                  disabled={checkoutLoading || !canPurchase || (item.priceType === 'points' && balance < item.price)}
                  className="font-cute min-h-[44px] text-[11px] px-3 py-1 rounded-full bg-pastel-lavender text-ink w-full disabled:opacity-50"
                >
                  구매하기
                </button>
              )}
            </div>
          )
        })}
      </div>

      {view === 'wardrobe' && visibleItems.length === 0 && (
        <div className="w-full max-w-sm rounded-3xl bg-white/70 px-6 py-10 text-center shadow-sm">
          <div className="mb-3 text-4xl" aria-hidden="true">🧺</div>
          <p className="font-cute text-sm text-ink">아직 보유한 아이템이 없어요.</p>
          <p className="mt-1 font-cute text-xs text-ink-soft">상점에서 마음에 드는 아이템을 모아보세요!</p>
          <button
            type="button"
            onClick={() => changeView('shop')}
            className="mt-4 rounded-full bg-pastel-lavender px-4 py-2 font-cute text-xs text-ink"
          >
            상점 구경하기
          </button>
        </div>
      )}

      {view === 'shop' && (
        <p className="text-ink-soft text-xs font-cute text-center max-w-sm">
          캐시 아이템은 Stripe 테스트 모드 구조로 연결돼 있어요. 실제 결제는 발생하지 않습니다.
        </p>
      )}
      </div>
    </main>
  )
}
