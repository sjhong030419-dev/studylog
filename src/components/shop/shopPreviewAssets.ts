export interface ShopPreviewAssets {
  thumbnail: string
  banner: string
  icon: string
}

export const SHOP_PREVIEW_ASSETS: Readonly<Record<string, ShopPreviewAssets>> = {
  'skin-sakura-uniform-girl': {
    thumbnail: '/sprites/shop/sakura-uniform/thumbnail.webp',
    banner: '/sprites/shop/sakura-uniform/banner.webp',
    icon: '/sprites/shop/sakura-uniform/icon.webp',
  },
  'skin-moonlight-academy': {
    thumbnail: '/sprites/shop/moonlight-academy/thumbnail.webp',
    banner: '/sprites/shop/moonlight-academy/banner.webp',
    icon: '/sprites/shop/moonlight-academy/icon.webp',
  },
  'skin-rainy-study-cafe': {
    thumbnail: '/sprites/shop/rainy-study-cafe/thumbnail.webp',
    banner: '/sprites/shop/rainy-study-cafe/banner.webp',
    icon: '/sprites/shop/rainy-study-cafe/icon.webp',
  },
}

/** The banner's fallback chain: banner image → thumbnail image → nothing
 * (`AvatarShop.tsx` then simply doesn't render the banner slot at all,
 * leaving the live `CharacterView` preview already shown beneath it as the
 * final fallback) — never a broken-image icon. `failedImages` is keyed by
 * URL, not by item id, so this needs no per-item reset when the caller
 * switches which item it's previewing. Returns `undefined` for an item with
 * no illustrated preview at all (not every shop item has one). */
export function resolveShopPreviewBanner(itemId: string, failedImages: ReadonlySet<string>): string | undefined {
  const assets = SHOP_PREVIEW_ASSETS[itemId]
  if (!assets) return undefined
  return [assets.banner, assets.thumbnail].find((src) => !failedImages.has(src))
}

/** The shop grid's per-item thumbnail: falls back to `undefined` (the caller
 * then shows the item's emoji instead) once its one candidate image has
 * failed — there's nothing smaller to fall back to for a grid tile. */
export function resolveShopPreviewThumbnail(itemId: string, failedImages: ReadonlySet<string>): string | undefined {
  const thumbnail = SHOP_PREVIEW_ASSETS[itemId]?.thumbnail
  if (!thumbnail || failedImages.has(thumbnail)) return undefined
  return thumbnail
}
