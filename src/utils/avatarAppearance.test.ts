import { describe, expect, it } from 'vitest'
import { resolveAvatarAppearance } from './avatarAppearance'
import { resolveCatalogEntries, findCatalogEntry } from '../character/catalog/items'
import type { ShopItem } from '../types'

const ITEMS: ShopItem[] = [
  { id: 'outfit-blue', category: 'outfit', name: '파란 니트', priceType: 'points', price: 40, emoji: '🔵', colorHex: '#a8d8ff' },
  { id: 'outfit-pink', category: 'outfit', name: '핑크 원피스', priceType: 'points', price: 40, emoji: '🌸', colorHex: '#ffd6e8' },
  { id: 'acc-glasses', category: 'accessory', name: '동그란 안경', priceType: 'points', price: 20, emoji: '👓' },
  { id: 'hair-ribbon', category: 'hair', name: '리본 헤어핀', priceType: 'points', price: 30, emoji: '🎀' },
  { id: 'hair-color-black', category: 'hairColor', name: '검정머리', priceType: 'points', price: 30, emoji: '⚫', colorHex: '#1B1A21' },
  { id: 'bg-night', category: 'background', name: '별 헤는 밤', priceType: 'points', price: 25, emoji: '🌙', colorHex: '#2d2a4a' },
]

describe('resolveAvatarAppearance', () => {
  it('resolves safely when nothing is equipped', () => {
    const result = resolveAvatarAppearance(ITEMS, {})
    expect(result.outfitColor).toBeUndefined()
    expect(result.backgroundColor).toBeUndefined()
    expect(result.equippedAssetIds).toEqual([])
  })

  it('maps an equipped outfit to the correct color', () => {
    const result = resolveAvatarAppearance(ITEMS, { outfit: 'outfit-blue' })
    expect(result.outfitColor).toBe('#a8d8ff')
    expect(result.equippedAssetIds).toContain('outfit-blue')
  })

  it('maps an equipped accessory into the equipped asset list', () => {
    const result = resolveAvatarAppearance(ITEMS, { accessory: 'acc-glasses' })
    expect(result.equippedAssetIds).toContain('acc-glasses')
  })

  it('maps an equipped hairColor into the equipped asset list, independent of the hair category', () => {
    const result = resolveAvatarAppearance(ITEMS, { hair: 'hair-ribbon', hairColor: 'hair-color-black' })
    expect(result.equippedAssetIds).toContain('hair-color-black')
    expect(result.equippedAssetIds).toContain('hair-ribbon')
  })

  it('maps an equipped background to the room', () => {
    const result = resolveAvatarAppearance(ITEMS, { background: 'bg-night' })
    expect(result.backgroundColor).toBe('#2d2a4a')
  })

  it('falls back safely for an unknown/missing equipped background', () => {
    const result = resolveAvatarAppearance(ITEMS, { background: 'not-a-real-id' })
    expect(result.backgroundColor).toBeUndefined()
  })
})

describe('cosmetic catalog resolution', () => {
  it('maps existing shop item ids to their catalog slot', () => {
    expect(findCatalogEntry('hair-ribbon')?.slot).toBe('headAccessory')
    expect(findCatalogEntry('acc-glasses')?.slot).toBe('faceAccessory')
    expect(findCatalogEntry('outfit-pink')?.slot).toBe('onePiece')
    expect(findCatalogEntry('outfit-blue')?.slot).toBe('top')
  })

  it('drops unknown ids instead of throwing', () => {
    expect(findCatalogEntry('not-a-real-id')).toBeUndefined()
    expect(() => resolveCatalogEntries(['not-a-real-id', 'also-fake'])).not.toThrow()
    expect(resolveCatalogEntries(['not-a-real-id'])).toEqual([])
  })

  it('resolves a mixed list of real and unknown ids, keeping only the real ones', () => {
    const entries = resolveCatalogEntries(['hair-ribbon', 'not-real', 'acc-glasses'])
    expect(entries.map((e) => e.id).sort()).toEqual(['acc-glasses', 'hair-ribbon'])
  })

  it('handles an empty or undefined equipped list safely', () => {
    expect(resolveCatalogEntries(undefined)).toEqual([])
    expect(resolveCatalogEntries([])).toEqual([])
  })
})
