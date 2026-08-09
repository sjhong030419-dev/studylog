import { describe, expect, it } from 'vitest'
import { SHOP_ITEMS } from '../store/shopStore'
import { buildCosmeticCatalog, COSMETIC_CATALOG } from './catalog'
import { resolveCosmeticSlot } from './slotAdapter'

describe('buildCosmeticCatalog (adapter fidelity — every existing shop item survives the adapter unchanged in identity)', () => {
  it('preserves every existing shop item id exactly, with none dropped and none invented', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    const catalogIds = catalog.map((item) => item.id).sort()
    const shopIds = SHOP_ITEMS.map((item) => item.id).sort()
    expect(catalogIds).toEqual(shopIds)
  })

  it('resolves a CosmeticSlot for every real shop item today (none silently unmapped)', () => {
    for (const item of SHOP_ITEMS) {
      expect(resolveCosmeticSlot(item), `${item.id} should resolve to a slot`).toBeDefined()
    }
  })

  it('carries zIndex over from the character catalog for character-slot items', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    const glasses = catalog.find((i) => i.id === 'acc-glasses')
    expect(glasses?.zIndex).toBe(65) // character/catalog/items.ts
    const ribbon = catalog.find((i) => i.id === 'hair-ribbon')
    expect(ribbon?.zIndex).toBe(50)
  })

  it('maps the 3 "hair" ShopCategory items to headAccessory, not a literal "hair" slot — they are head-worn accessories in character/catalog/items.ts, not hairstyle swaps', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    for (const id of ['hair-ribbon', 'hair-straw', 'hair-cap']) {
      expect(catalog.find((i) => i.id === id)?.slot).toBe('headAccessory')
    }
  })

  it('maps the "hairColor" ShopCategory item to the "hair" CosmeticSlot — its first real occupant', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    expect(catalog.find((i) => i.id === 'hair-color-black')?.slot).toBe('hair')
    // The 3 "hair"-category head accessories still don't occupy this slot —
    // only the new whole-avatar hairColor item does.
    const hairSlotItems = catalog.filter((i) => i.slot === 'hair')
    expect(hairSlotItems.map((i) => i.id)).toEqual(['hair-color-black'])
  })

  it('maps outfit items (top and onePiece CharacterSlots) onto the single "outfit" CosmeticSlot', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    for (const id of ['outfit-blue', 'outfit-pink', 'outfit-gold']) {
      expect(catalog.find((i) => i.id === id)?.slot).toBe('outfit')
    }
  })

  it('maps acc-necklace (backAccessory) to its own dedicated neckAccessory slot, independent of faceAccessory', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    expect(catalog.find((i) => i.id === 'acc-necklace')?.slot).toBe('neckAccessory')
    // acc-glasses stays in a different slot — a necklace and glasses must
    // be independently equippable, not compete for the same slot.
    expect(catalog.find((i) => i.id === 'acc-glasses')?.slot).toBe('faceAccessory')
  })

  it('maps background items to roomTheme via the ShopCategory fallback (no CharacterAssetDefinition exists for them)', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    for (const id of ['bg-sky', 'bg-night', 'bg-sakura']) {
      expect(catalog.find((i) => i.id === id)?.slot).toBe('roomTheme')
    }
  })

  it('maps cash items to acquisitionType premium and points items to points, without inventing a price for the other kind', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    const cashItem = catalog.find((i) => i.id === 'hair-cap')
    expect(cashItem?.acquisitionType).toBe('premium')
    expect(cashItem?.pointPrice).toBeUndefined()

    const pointsItem = catalog.find((i) => i.id === 'hair-ribbon')
    expect(pointsItem?.acquisitionType).toBe('points')
    expect(pointsItem?.pointPrice).toBe(30)
  })

  it('leaves supportedStates empty for every item — no cosmetic has real per-state PNG art yet', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    expect(catalog.every((item) => item.supportedStates.length === 0)).toBe(true)
  })

  it('never fabricates a thumbnailSrc — no production thumbnail pipeline exists yet', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    expect(catalog.every((item) => item.thumbnailSrc === undefined)).toBe(true)
  })

  it('leaves rarity as "unassigned" for every item — no real rarity data exists yet, so nothing is defaulted to "common"', () => {
    const catalog = buildCosmeticCatalog(SHOP_ITEMS)
    expect(catalog.every((item) => item.rarity === 'unassigned')).toBe(true)
  })

  it('COSMETIC_CATALOG (the exported real catalog) matches buildCosmeticCatalog(SHOP_ITEMS) exactly', () => {
    expect(COSMETIC_CATALOG).toEqual(buildCosmeticCatalog(SHOP_ITEMS))
  })
})
