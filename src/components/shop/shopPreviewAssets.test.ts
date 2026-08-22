import { describe, expect, it } from 'vitest'
import { SHOP_PREVIEW_ASSETS, resolveShopPreviewBanner, resolveShopPreviewThumbnail } from './shopPreviewAssets'

const SKIN_ITEM_IDS = ['skin-sakura-uniform-girl', 'skin-moonlight-academy', 'skin-rainy-study-cafe']

describe('shop skin illustration previews', () => {
  it.each(SKIN_ITEM_IDS)('provides a thumbnail, banner and icon for %s', (itemId) => {
    const assets = SHOP_PREVIEW_ASSETS[itemId]
    expect(assets.thumbnail).toMatch(/\/thumbnail\.webp$/)
    expect(assets.banner).toMatch(/\/banner\.webp$/)
    expect(assets.icon).toMatch(/\/icon\.webp$/)
  })
})

describe('resolveShopPreviewBanner (fallback chain: banner -> thumbnail -> nothing)', () => {
  it.each(SKIN_ITEM_IDS)('returns the banner when nothing has failed, for %s', (itemId) => {
    expect(resolveShopPreviewBanner(itemId, new Set())).toBe(SHOP_PREVIEW_ASSETS[itemId].banner)
  })

  it.each(SKIN_ITEM_IDS)('falls back to the thumbnail once the banner has failed, for %s', (itemId) => {
    const failed = new Set([SHOP_PREVIEW_ASSETS[itemId].banner])
    expect(resolveShopPreviewBanner(itemId, failed)).toBe(SHOP_PREVIEW_ASSETS[itemId].thumbnail)
  })

  it.each(SKIN_ITEM_IDS)('returns undefined once both the banner and thumbnail have failed, for %s', (itemId) => {
    const failed = new Set([SHOP_PREVIEW_ASSETS[itemId].banner, SHOP_PREVIEW_ASSETS[itemId].thumbnail])
    expect(resolveShopPreviewBanner(itemId, failed)).toBeUndefined()
  })

  it('returns undefined for an item with no illustrated preview at all', () => {
    expect(resolveShopPreviewBanner('hair-ribbon', new Set())).toBeUndefined()
  })
})

describe('resolveShopPreviewThumbnail', () => {
  it.each(SKIN_ITEM_IDS)('returns the thumbnail when it has not failed, for %s', (itemId) => {
    expect(resolveShopPreviewThumbnail(itemId, new Set())).toBe(SHOP_PREVIEW_ASSETS[itemId].thumbnail)
  })

  it.each(SKIN_ITEM_IDS)('returns undefined once the thumbnail has failed (caller falls back to the emoji), for %s', (itemId) => {
    const failed = new Set([SHOP_PREVIEW_ASSETS[itemId].thumbnail])
    expect(resolveShopPreviewThumbnail(itemId, failed)).toBeUndefined()
  })

  it('returns undefined for an item with no illustrated preview at all', () => {
    expect(resolveShopPreviewThumbnail('hair-ribbon', new Set())).toBeUndefined()
  })
})
