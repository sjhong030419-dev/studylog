import { describe, expect, it } from 'vitest'
import {
  CHARACTER_HEIGHT_RATIO,
  CHARACTER_WIDTH_RATIO,
  ROOM_ASSET_MANIFEST,
  ROOM_CANVAS_HEIGHT,
  ROOM_CANVAS_WIDTH,
  ROOM_CHARACTER_Z_INDEX,
} from './roomAssetManifest'

describe('ROOM_ASSET_MANIFEST (public/sprites/room/ file naming contract)', () => {
  const layers = ROOM_ASSET_MANIFEST['default-night']

  it('declares exactly the 14 layer files specified for default-night', () => {
    expect(layers).toHaveLength(14)
    const ids = layers.map((l) => l.id).sort()
    expect(ids).toEqual(
      [
        'background', 'window-night', 'shelf', 'desk-back', 'desk-front',
        'lamp', 'books', 'mug', 'stationery', 'plant', 'cat', 'rug',
        'foreground', 'lamp-glow',
      ].sort(),
    )
  })

  it('resolves every path under the theme-scoped room sprite folder', () => {
    for (const layer of layers) {
      expect(layer.src).toBe(`/sprites/room/default-night/${layer.id}.png`)
    }
  })

  it('has no duplicate ids', () => {
    const ids = layers.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no duplicate z-indexes (unambiguous stacking order)', () => {
    const zIndexes = layers.map((l) => l.zIndex)
    expect(new Set(zIndexes).size).toBe(zIndexes.length)
  })

  it('assigns background the lowest z-index and lighting the highest', () => {
    const background = layers.find((l) => l.id === 'background')!
    const lampGlow = layers.find((l) => l.id === 'lamp-glow')!
    for (const layer of layers) {
      expect(background.zIndex).toBeLessThanOrEqual(layer.zIndex)
      expect(lampGlow.zIndex).toBeGreaterThanOrEqual(layer.zIndex)
    }
  })

  it('places every behindCharacter layer below ROOM_CHARACTER_Z_INDEX and every deskFront/foreground/lighting layer above it', () => {
    for (const layer of layers) {
      if (layer.group === 'background' || layer.group === 'behindCharacter') {
        expect(layer.zIndex).toBeLessThan(ROOM_CHARACTER_Z_INDEX)
      } else {
        expect(layer.zIndex).toBeGreaterThan(ROOM_CHARACTER_Z_INDEX)
      }
    }
  })

  it('mirrors the existing SVG room growth-stage thresholds for plant (Lv10) and cat (Lv20)', () => {
    expect(layers.find((l) => l.id === 'plant')?.minLevel).toBe(10)
    expect(layers.find((l) => l.id === 'cat')?.minLevel).toBe(20)
  })

  it('gates no layer on a shop item yet (no purchasable room-prop item exists in the catalog today)', () => {
    for (const layer of layers) {
      expect(layer.shopItemId).toBeUndefined()
    }
  })
})

describe('room canvas + character placement contract', () => {
  it('keeps the same 4:5 aspect ratio as the legacy 320x400 SVG viewBox, just at 2x resolution', () => {
    expect(ROOM_CANVAS_WIDTH / ROOM_CANVAS_HEIGHT).toBeCloseTo(320 / 400, 5)
  })

  it('keeps the character within the required 38-45% of room height', () => {
    expect(CHARACTER_HEIGHT_RATIO).toBeGreaterThanOrEqual(0.38)
    expect(CHARACTER_HEIGHT_RATIO).toBeLessThanOrEqual(0.45)
  })

  it('derives CHARACTER_WIDTH_RATIO so a square (1:1) character canvas renders at exactly CHARACTER_HEIGHT_RATIO of room height', () => {
    const renderedWidthPx = CHARACTER_WIDTH_RATIO * ROOM_CANVAS_WIDTH
    const renderedHeightPx = renderedWidthPx // square canvas: height == width in px
    expect(renderedHeightPx / ROOM_CANVAS_HEIGHT).toBeCloseTo(CHARACTER_HEIGHT_RATIO, 5)
  })
})
