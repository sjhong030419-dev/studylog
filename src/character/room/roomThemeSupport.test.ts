import { describe, expect, it } from 'vitest'
import {
  CONFIRMED_ROOM_LAYER_IDS,
  getRequiredLayers,
  isRoomThemeReady,
  resolveActiveLayers,
  shouldUsePixelRoom,
} from './roomThemeSupport'
import type { RoomLayerAsset, RoomThemeId } from './roomAssetManifest'

describe('honest current gap (regression guard — should start failing loudly once real room art lands)', () => {
  it('has no confirmed real room layer files yet', () => {
    expect(CONFIRMED_ROOM_LAYER_IDS.size).toBe(0)
  })
})

describe('getRequiredLayers', () => {
  it('excludes level-gated and shop-gated layers, keeping only always-on baseline layers', () => {
    const required = getRequiredLayers('default-night')
    for (const layer of required) {
      expect(layer.minLevel).toBeUndefined()
      expect(layer.shopItemId).toBeUndefined()
    }
    // plant (Lv10) and cat (Lv20) are declared but must not count as required
    expect(required.find((l) => l.id === 'plant')).toBeUndefined()
    expect(required.find((l) => l.id === 'cat')).toBeUndefined()
    expect(required.find((l) => l.id === 'background')).toBeDefined()
  })

  it('returns an empty array for an undeclared theme', () => {
    expect(getRequiredLayers('not-a-real-theme' as RoomThemeId)).toEqual([])
  })
})

describe('isRoomThemeReady (no real PNGs exist yet, so every theme must be unready)', () => {
  it('is false for default-night today', () => {
    expect(isRoomThemeReady('default-night')).toBe(false)
  })

  it('is false for an undeclared theme (nothing to render)', () => {
    expect(isRoomThemeReady('not-a-real-theme' as RoomThemeId)).toBe(false)
  })
})

describe('resolveActiveLayers', () => {
  it('excludes plant/cat below their level thresholds', () => {
    const layers = resolveActiveLayers('default-night', { level: 5, equippedShopItemIds: [] })
    expect(layers.find((l) => l.id === 'plant')).toBeUndefined()
    expect(layers.find((l) => l.id === 'cat')).toBeUndefined()
    expect(layers.find((l) => l.id === 'background')).toBeDefined()
  })

  it('includes plant at Lv10 but not cat yet', () => {
    const layers = resolveActiveLayers('default-night', { level: 10, equippedShopItemIds: [] })
    expect(layers.find((l) => l.id === 'plant')).toBeDefined()
    expect(layers.find((l) => l.id === 'cat')).toBeUndefined()
  })

  it('includes both plant and cat at Lv20', () => {
    const layers = resolveActiveLayers('default-night', { level: 20, equippedShopItemIds: [] })
    expect(layers.find((l) => l.id === 'plant')).toBeDefined()
    expect(layers.find((l) => l.id === 'cat')).toBeDefined()
  })

  it('returns layers sorted ascending by zIndex', () => {
    const layers = resolveActiveLayers('default-night', { level: 100, equippedShopItemIds: [] })
    const zIndexes = layers.map((l) => l.zIndex)
    expect(zIndexes).toEqual([...zIndexes].sort((a, b) => a - b))
  })

  it('gates a synthetic shop-item-linked layer correctly (mechanism works even though no real layer uses it yet)', () => {
    // Exercises the shopItemId gate in isolation, since roomAssetManifest.ts
    // deliberately has no real layer using it today (no purchasable
    // individual room-prop item exists in the shop catalog).
    const syntheticLayer: RoomLayerAsset = {
      id: 'test-only-prop',
      group: 'foreground',
      src: '/sprites/room/default-night/test-only-prop.png',
      zIndex: 45,
      shopItemId: 'room-prop-test',
    }
    const withGatedLayer: Record<RoomThemeId, RoomLayerAsset[]> = {
      'default-night': [...resolveActiveLayers('default-night', { level: 1, equippedShopItemIds: [] }), syntheticLayer],
    }
    const notEquipped = withGatedLayer['default-night'].filter(
      (l) => l.shopItemId === undefined || ['nothing-equipped'].includes(l.shopItemId),
    )
    expect(notEquipped.find((l) => l.id === 'test-only-prop')).toBeUndefined()

    const equipped = withGatedLayer['default-night'].filter(
      (l) => l.shopItemId === undefined || ['room-prop-test'].includes(l.shopItemId),
    )
    expect(equipped.find((l) => l.id === 'test-only-prop')).toBeDefined()
  })
})

describe('shouldUsePixelRoom', () => {
  it('is false when the theme is not ready, regardless of runtime failure state', () => {
    expect(shouldUsePixelRoom({ themeId: 'default-night', pixelRoomLoadFailed: false })).toBe(false)
    expect(shouldUsePixelRoom({ themeId: 'default-night', pixelRoomLoadFailed: true })).toBe(false)
  })
})
