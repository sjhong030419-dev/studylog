import { describe, expect, it } from 'vitest'
import { SHOP_PREVIEW_ASSETS } from './shopPreviewAssets'

describe('shop skin illustration previews', () => {
  it.each([
    'skin-sakura-uniform-girl',
    'skin-moonlight-academy',
    'skin-rainy-study-cafe',
  ])('provides a thumbnail, banner and icon for %s', (itemId) => {
    const assets = SHOP_PREVIEW_ASSETS[itemId]
    expect(assets.thumbnail).toMatch(/\/thumbnail\.webp$/)
    expect(assets.banner).toMatch(/\/banner\.webp$/)
    expect(assets.icon).toMatch(/\/icon\.webp$/)
  })
})
