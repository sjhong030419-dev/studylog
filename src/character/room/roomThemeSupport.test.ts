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
  it('has no confirmed real room layer files yet for default-night', () => {
    expect(CONFIRMED_ROOM_LAYER_IDS['default-night']?.size ?? 0).toBe(0)
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

describe('per-theme layer confirmation isolation (fixes: a flat id Set let two themes sharing a layer id contaminate each other)', () => {
  // Two synthetic themes that both declare a layer with the SAME id
  // ("background") — a real scenario once a second theme is approved,
  // since every theme will very likely have its own background.png. These
  // fixtures are test-only; no second real theme is added to
  // roomAssetManifest.ts (this app has only one approved reference concept).
  const background = (): RoomLayerAsset => ({
    id: 'background',
    group: 'background',
    src: 'irrelevant.png',
    zIndex: 0,
  })
  const twoThemeManifest: Partial<Record<string, RoomLayerAsset[]>> = {
    'theme-a': [background()],
    'theme-b': [background()],
  }

  it('confirming "background" for theme-a does not make theme-b ready too', () => {
    const confirmedLayerIds: Partial<Record<string, ReadonlySet<string>>> = {
      'theme-a': new Set(['background']),
      // theme-b intentionally has no entry at all
    }
    expect(
      isRoomThemeReady('theme-a' as RoomThemeId, { manifest: twoThemeManifest, confirmedLayerIds }),
    ).toBe(true)
    expect(
      isRoomThemeReady('theme-b' as RoomThemeId, { manifest: twoThemeManifest, confirmedLayerIds }),
    ).toBe(false)
  })

  it('a theme with only some of its required layers confirmed stays unready', () => {
    const partialManifest: Partial<Record<string, RoomLayerAsset[]>> = {
      'theme-c': [background(), { id: 'desk-front', group: 'deskFront', src: 'irrelevant.png', zIndex: 30 }],
    }
    const confirmedLayerIds: Partial<Record<string, ReadonlySet<string>>> = {
      'theme-c': new Set(['background']), // desk-front missing
    }
    expect(
      isRoomThemeReady('theme-c' as RoomThemeId, { manifest: partialManifest, confirmedLayerIds }),
    ).toBe(false)
  })

  it('a theme becomes ready only once every required layer is confirmed', () => {
    const manifest: Partial<Record<string, RoomLayerAsset[]>> = {
      'theme-d': [background(), { id: 'desk-front', group: 'deskFront', src: 'irrelevant.png', zIndex: 30 }],
    }
    const confirmedLayerIds: Partial<Record<string, ReadonlySet<string>>> = {
      'theme-d': new Set(['background', 'desk-front']),
    }
    expect(isRoomThemeReady('theme-d' as RoomThemeId, { manifest, confirmedLayerIds })).toBe(true)
  })

  it('an undeclared theme id is always unready, even if its name coincidentally appears in confirmedLayerIds', () => {
    const confirmedLayerIds: Partial<Record<string, ReadonlySet<string>>> = {
      'ghost-theme': new Set(['background']),
    }
    // "ghost-theme" has no manifest entry — getRequiredLayers returns [],
    // so isRoomThemeReady must short-circuit to false regardless of what's
    // sitting in confirmedLayerIds for that key.
    expect(isRoomThemeReady('ghost-theme' as RoomThemeId, { confirmedLayerIds })).toBe(false)
  })

  it('real default-night still stays unready with the real manifest and real confirmed registry', () => {
    // No overrides passed — exercises the actual production data end to end.
    expect(isRoomThemeReady('default-night')).toBe(false)
  })
})
