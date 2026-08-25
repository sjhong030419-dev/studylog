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
import { resolveShopPreviewBanner, resolveShopPreviewThumbnail } from './shopPreviewAssets'
import { isFullSceneSkinItem } from '../../character/room/fullSceneState'

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
  // Keyed by image URL (not by item/index) so switching preview items never
  // needs an explicit reset effect — a different item's src is simply never
  // in this set. A failed banner falls back to the thumbnail; if that also
  // fails, the banner slot just doesn't render at all, leaving the
  // CharacterView preview below it (already on screen either way) as the
  // final fallback — never a broken-image icon.
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const markImageFailed = (src: string) =>
    setFailedImages((prev) => (prev.has(src) ? prev : new Set(prev).add(src)))

  const previewItem = items.find((item) => item.id === previewItemId)
  const previewAppearance = previewItem
    ? resolveAvatarAppearance(items, buildPreviewEquipped(equipped, previewItem))
    : appearance
  const previewBanner = previewItem ? resolveShopPreviewBanner(previewItem.id, failedImages) : undefined

  const visibleItems = items.filter((item) => {
    if (view === 'wardrobe' && !ownedItemIds.includes(item.id)) return false
    return category === 'all' || item.category === category
  })
  const equippedCount = Object.values(equipped).filter(Boolean).length

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
    <main className="min-h-screen px-2 pb-32 pt-4 sm:px-5">
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4">
      <div className="flex w-full items-end justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="font-cute text-xs tracking-wide text-ink-soft">MAKE IT YOUR CHARACTER</p>
          <h1 className="font-cute text-[32px] leading-tight text-ink sm:text-4xl">{view === 'shop' ? '아바타 상점 🛍️' : '내 옷장 👗'}</h1>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/80 bg-white/75 px-3 py-2 text-right shadow-sm">
          <p className="font-cute text-[11px] text-ink-soft">내 포인트</p>
          <p className="font-pixel text-base text-ink">🪙 {balance}P</p>
        </div>
      </div>

      {view === 'shop' && <MoonlightSeasonCard />}

      <div className="flex w-full rounded-2xl bg-white/70 p-1 shadow-sm" aria-label="아바타 메뉴">
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
          내 옷장 · {ownedItemIds.length}
        </button>
      </div>

      <div
        className="flex w-full flex-col items-center gap-3 rounded-[28px] border border-white/80 px-3 py-4 shadow-[0_12px_30px_rgba(108,82,130,0.11)] backdrop-blur sm:px-5"
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
        {previewBanner && (
          <img
            src={previewBanner}
            alt={`${previewItem?.name ?? '스킨'} 남녀 캐릭터와 공부방 미리보기`}
            className="aspect-[16/9] w-full rounded-[22px] object-cover shadow-md"
            draggable={false}
            decoding="async"
            onError={() => markImageFailed(previewBanner)}
          />
        )}
        {!previewBanner && <CharacterView state="happy" gender={gender} appearance={previewAppearance} size={180} />}
        <div
          className="flex w-full items-center justify-center gap-4 font-cute text-xs"
          style={{ color: readableInkColor(previewAppearance.backgroundColor, 'var(--color-ink)') }}
        >
          <span>보유 아이템 {ownedItemIds.length}</span>
          <span aria-hidden="true">·</span>
          <span>착용 중 {equippedCount}</span>
        </div>
      </div>

      {view === 'shop' && (
        <button
          type="button"
          onClick={watchAdForBonus}
          disabled={adWatchesToday >= AD_DAILY_LIMIT || checkoutLoading}
          className="min-h-[48px] w-full rounded-2xl bg-pastel-mint px-4 py-2 font-cute text-sm text-ink shadow-sm disabled:opacity-50"
        >
          {checkoutLoading
            ? '광고 재생 중...'
            : `📺 광고 보고 +${AD_BONUS_POINTS}P 받기 (오늘 ${adWatchesToday}/${AD_DAILY_LIMIT})`}
        </button>
      )}

      <div className="flex w-full snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {view === 'wardrobe' && (
          <button
            type="button"
            onClick={() => changeCategory('all')}
            className={`min-h-[44px] shrink-0 snap-start rounded-full border px-4 py-2 font-cute text-sm ${
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
            className={`min-h-[44px] shrink-0 snap-start rounded-full border px-4 py-2 font-cute text-sm ${
              category === c ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
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
          const isGenderSupported =
            !isWholeAvatarItem || isWholeAvatarItemSupportedForGender(item.id, gender) || isFullSceneSkinItem(item.id)
          const canPurchase = isPngSupported && isGenderSupported
          const canPreview = isPngSupported && isGenderSupported
          const isPreviewing = previewItemId === item.id
          const previewImage = resolveShopPreviewThumbnail(item.id, failedImages)
          return (
            <div
              key={item.id}
              className={`relative flex min-w-0 flex-col items-center gap-2.5 rounded-[26px] border px-3 py-3 shadow-sm sm:px-4 sm:py-4 ${
                isEquipped ? 'border-amber-200 bg-pastel-yellow' : 'border-white/80 bg-white/70'
              }`}
            >
              {(isEquipped || owned) && (
                <span className={`absolute right-3 top-3 z-10 rounded-full px-3 py-2 font-cute text-xs shadow-sm ${isEquipped ? 'bg-ink text-white' : 'bg-white/90 text-ink'}`}>
                  {isEquipped ? '착용중' : '보유'}
                </span>
              )}
              {previewImage ? (
                <img
                  src={previewImage}
                  alt=""
                  className="mb-1 aspect-[16/10] w-full rounded-[20px] object-cover shadow-md"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                  onError={() => markImageFailed(previewImage)}
                />
              ) : (
                <span className="grid aspect-[16/10] w-full place-items-center rounded-[20px] bg-white/55 text-8xl shadow-inner">{item.emoji}</span>
              )}
              <span className="line-clamp-2 min-h-[44px] w-full text-center font-cute text-base leading-6 text-ink">{item.name}</span>
              <span className="font-pixel text-sm text-ink-soft">
                {item.priceType === 'points' ? `${item.price}P` : `₩${item.price.toLocaleString()}`}
              </span>
              {isWholeAvatarItem && (
                <span className="rounded-full bg-ink/10 px-2 py-1 text-center font-cute text-[10px] text-ink-soft">
                  남녀 캐릭터 지원
                </span>
              )}
              {isWholeAvatarItem && !isGenderSupported && (
                <span className="rounded-full bg-pastel-pink px-2 py-1 text-center font-cute text-[10px] text-ink">
                  지금은 남자 캐릭터라 적용되지 않아요
                </span>
              )}
              {!isWholeAvatarItem && !isPngSupported && (
                <span className="rounded-full bg-ink/10 px-2 py-1 text-center font-cute text-[10px] text-ink-soft">
                  새 캐릭터 대응 준비 중
                </span>
              )}

              <div className="mt-auto grid w-full grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewItemId(isPreviewing ? null : item.id)}
                  disabled={!canPreview}
                  aria-pressed={isPreviewing}
                  className={`min-h-[52px] rounded-2xl border px-2 py-1 font-cute text-sm disabled:opacity-40 ${
                    isPreviewing ? 'border-ink/20 bg-pastel-yellow text-ink' : 'border-ink/15 bg-white text-ink'
                  }`}
                >
                  {isPreviewing ? '보는 중' : '미리보기'}
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
                  className={`min-h-[52px] rounded-2xl px-2 py-1 font-cute text-sm ${
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
                  className="min-h-[52px] rounded-2xl bg-pastel-lavender px-2 py-1 font-cute text-sm text-ink disabled:opacity-50"
                >
                  구매하기
                </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {view === 'wardrobe' && visibleItems.length === 0 && (
        <div className="w-full rounded-3xl bg-white/70 px-6 py-10 text-center shadow-sm">
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
        <p className="w-full text-center font-cute text-xs text-ink-soft">
          캐시 아이템은 Stripe 테스트 모드 구조로 연결돼 있어요. 실제 결제는 발생하지 않습니다.
        </p>
      )}
      </div>
    </main>
  )
}
