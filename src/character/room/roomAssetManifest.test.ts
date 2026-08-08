import { describe, expect, it } from 'vitest'
import { SHOP_ITEMS } from '../../store/shopStore'
import {
  CHARACTER_HEIGHT_RATIO,
  CHARACTER_WIDTH_RATIO,
  computeCharacterBoxPx,
  MAX_CHARACTER_HEIGHT_RATIO,
  PNG_RENDERER_ASPECT_RATIO,
  resolveCharacterHeightRatio,
  resolveCharacterWidthRatio,
  ROOM_ASSET_MANIFEST,
  ROOM_CANVAS_HEIGHT,
  ROOM_CANVAS_WIDTH,
  ROOM_CHARACTER_SIZE_CAP,
  ROOM_CHARACTER_Z_INDEX,
  SVG_RENDERER_ASPECT_RATIO,
} from './roomAssetManifest'

describe('ROOM_ASSET_MANIFEST (public/sprites/room/ file naming contract)', () => {
  const layers = ROOM_ASSET_MANIFEST['default-night']

  it('declares exactly the 18 default-night layers, including study-only tools and hands', () => {
    expect(layers).toHaveLength(18)
    const ids = layers.map((l) => l.id).sort()
    expect(ids).toEqual(
      [
        'background', 'window-night', 'shelf', 'desk-back', 'desk-front', 'desk-front-study',
        'lamp', 'books', 'mug', 'stationery', 'plant', 'cat', 'rug',
        'foreground', 'lamp-glow', 'desk-prop-plant-pot', 'study-tools', 'study-hands',
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

  it('gates every layer except the planned desk-prop on a shop item — no other purchasable room-prop item exists in the catalog today', () => {
    for (const layer of layers) {
      if (layer.id === 'desk-prop-plant-pot') continue
      expect(layer.shopItemId).toBeUndefined()
    }
  })

  it('the planned desk-prop\'s shopItemId does not correspond to any real SHOP_ITEMS entry — it can never actually render for a real user yet', () => {
    const deskProp = layers.find((l) => l.id === 'desk-prop-plant-pot')!
    expect(deskProp.shopItemId).toBe('desk-prop-plant-pot')
    expect(SHOP_ITEMS.some((item) => item.id === deskProp.shopItemId)).toBe(false)
  })

  it('the planned desk-prop is optional (shop-gated), never required — does not block default-night from becoming ready', () => {
    const required = layers.filter((l) => l.minLevel === undefined && l.shopItemId === undefined)
    expect(required.some((l) => l.id === 'desk-prop-plant-pot')).toBe(false)
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

describe('computeCharacterBoxPx (responsive sizing regression guard — 320/390/430)', () => {
  // These three widths are the project's required supported breakpoints
  // (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md §8), and CharacterRoomCard
  // renders the room card nearly edge-to-edge on mobile, so treating room
  // width ≈ viewport width is a reasonable approximation for this guard.
  const SUPPORTED_WIDTHS = [320, 390, 430]

  it.each(SUPPORTED_WIDTHS)('stays within the required 38-45%% height ratio at %ipx', (width) => {
    const { heightRatio } = computeCharacterBoxPx(width)
    expect(heightRatio).toBeGreaterThanOrEqual(0.38)
    expect(heightRatio).toBeLessThanOrEqual(0.45)
  })

  it.each(SUPPORTED_WIDTHS)(
    'never exceeds ROOM_CHARACTER_SIZE_CAP at %ipx (the fixed regression: CharacterView defaulted to a 160px cap that bound before the ratio did)',
    (width) => {
      const { widthPx } = computeCharacterBoxPx(width)
      expect(widthPx).toBeLessThan(ROOM_CHARACTER_SIZE_CAP)
      // The old default (160) would have wrongly clamped the character
      // below its intended ratio at every one of these real widths —
      // this is the exact bug the size-cap fix addresses.
      expect(widthPx).toBeGreaterThan(160)
    },
  )

  it.each(SUPPORTED_WIDTHS)('stays proportional (never squished) — width always equals height at %ipx', (width) => {
    const { widthPx, heightPx } = computeCharacterBoxPx(width)
    expect(widthPx).toBe(heightPx)
  })

  it('also holds at the Home card scale (characterScale 1.3) without exceeding the size cap', () => {
    for (const width of SUPPORTED_WIDTHS) {
      const { widthPx } = computeCharacterBoxPx(width, 1.3)
      expect(widthPx).toBeLessThan(ROOM_CHARACTER_SIZE_CAP)
    }
  })

  describe('CharacterRoomCard\'s characterScale=1.3 must not blow past the 38-45% PRD range', () => {
    // Home passes characterScale=1.3 to RoomScene — that value is tuned for
    // LegacySvgRoomRenderer's own unrelated `58% × scale` width formula.
    // Naively applying the same 1.3× to the pixel room's ratio would give
    // 0.42 × 1.3 = 54.6%, well outside 38-45% — this is exactly the bug
    // being fixed here.
    it.each(SUPPORTED_WIDTHS)('stays within 38-45%% height ratio at %ipx even with characterScale=1.3', (width) => {
      const { heightRatio } = computeCharacterBoxPx(width, 1.3)
      expect(heightRatio).toBeGreaterThanOrEqual(0.38)
      expect(heightRatio).toBeLessThanOrEqual(0.45)
    })

    it.each(SUPPORTED_WIDTHS)('the height ratio at %ipx is independent of room width (pure percentage, not px-dependent)', (width) => {
      const { heightRatio } = computeCharacterBoxPx(width, 1.3)
      expect(heightRatio).toBeCloseTo(MAX_CHARACTER_HEIGHT_RATIO, 5)
    })

    it('unclamped 1.3× would have exceeded 45% (proves the clamp is actually doing something, not a no-op)', () => {
      const naiveUnclamped = CHARACTER_HEIGHT_RATIO * 1.3
      expect(naiveUnclamped).toBeGreaterThan(MAX_CHARACTER_HEIGHT_RATIO)
    })
  })
})

describe('computeCharacterBoxPx aspect-ratio parameter — PNG 1:1 vs SVG 5:6 (fixes: PixelRoomRenderer no longer assumes a square canvas)', () => {
  // ChibiFallbackArt's viewBox="0 0 200 240" is 5:6 (taller than it is
  // wide) — the exact case that broke the previous width-first formula:
  // clamping the WIDTH to 45%-equivalent still let the SVG's derived
  // height run to 45% × 1.2 ≈ 54%. computeCharacterBoxPx now derives
  // height FIRST (aspect-ratio independent) and width second, mirroring
  // what CharacterView's fit="height" mode actually does in CSS.
  const SUPPORTED_WIDTHS = [320, 390, 430]

  it.each(SUPPORTED_WIDTHS)(
    'PNG (1:1) and SVG (5:6) hit the IDENTICAL height ratio at %ipx, even with characterScale=1.3',
    (width) => {
      const png = computeCharacterBoxPx(width, 1.3, PNG_RENDERER_ASPECT_RATIO)
      const svg = computeCharacterBoxPx(width, 1.3, SVG_RENDERER_ASPECT_RATIO)
      expect(png.heightRatio).toBeCloseTo(svg.heightRatio, 10)
    },
  )

  it.each(SUPPORTED_WIDTHS)('both PNG and SVG stay within 38-45%% at %ipx with characterScale=1.3 (the exact bug report)', (width) => {
    for (const aspectRatio of [PNG_RENDERER_ASPECT_RATIO, SVG_RENDERER_ASPECT_RATIO]) {
      const { heightRatio } = computeCharacterBoxPx(width, 1.3, aspectRatio)
      expect(heightRatio).toBeGreaterThanOrEqual(0.38)
      expect(heightRatio).toBeLessThanOrEqual(0.45)
    }
  })

  it.each(SUPPORTED_WIDTHS)('both PNG and SVG also stay within 38-45%% at %ipx at the default scale (1)', (width) => {
    for (const aspectRatio of [PNG_RENDERER_ASPECT_RATIO, SVG_RENDERER_ASPECT_RATIO]) {
      const { heightRatio } = computeCharacterBoxPx(width, 1, aspectRatio)
      expect(heightRatio).toBeGreaterThanOrEqual(0.38)
      expect(heightRatio).toBeLessThanOrEqual(0.45)
    }
  })

  it.each(SUPPORTED_WIDTHS)('PNG never distorts — width always equals height at %ipx', (width) => {
    const { widthPx, heightPx } = computeCharacterBoxPx(width, 1.3, PNG_RENDERER_ASPECT_RATIO)
    expect(widthPx).toBeCloseTo(heightPx, 10)
  })

  it.each(SUPPORTED_WIDTHS)('SVG never distorts — width:height always equals exactly 200:240 at %ipx', (width) => {
    const { widthPx, heightPx } = computeCharacterBoxPx(width, 1.3, SVG_RENDERER_ASPECT_RATIO)
    expect(widthPx / heightPx).toBeCloseTo(200 / 240, 10)
  })

  it.each(SUPPORTED_WIDTHS)('SVG is narrower than PNG at the same height (5:6 vs 1:1) — so it never overflows where PNG wouldn\'t, at %ipx', (width) => {
    const png = computeCharacterBoxPx(width, 1.3, PNG_RENDERER_ASPECT_RATIO)
    const svg = computeCharacterBoxPx(width, 1.3, SVG_RENDERER_ASPECT_RATIO)
    expect(svg.widthPx).toBeLessThan(png.widthPx)
    expect(svg.heightPx).toBeCloseTo(png.heightPx, 10) // same height — only width differs by aspect ratio
  })

  it('an unclamped SVG at 1.3x would have exceeded 45% by even more than PNG did (the exact regression this turn fixes)', () => {
    // Reproduces the reported math: naive width-first clamp gave PNG
    // 45% but let SVG's *derived* height run to ~54% (45% × 1.2).
    const naiveSvgHeightRatio = MAX_CHARACTER_HEIGHT_RATIO * (240 / 200)
    expect(naiveSvgHeightRatio).toBeGreaterThan(MAX_CHARACTER_HEIGHT_RATIO)
    expect(naiveSvgHeightRatio).toBeCloseTo(0.54, 2)
    // ...but the actual (fixed) computeCharacterBoxPx never produces this:
    const actualSvg = computeCharacterBoxPx(390, 1.3, SVG_RENDERER_ASPECT_RATIO)
    expect(actualSvg.heightRatio).toBeLessThanOrEqual(MAX_CHARACTER_HEIGHT_RATIO)
  })
})

describe('resolveCharacterHeightRatio / resolveCharacterWidthRatio (the clamp mechanism itself)', () => {
  it('does not clamp at the default scale (1) — matches the unclamped constants exactly', () => {
    expect(resolveCharacterHeightRatio(1)).toBe(CHARACTER_HEIGHT_RATIO)
    expect(resolveCharacterWidthRatio(1)).toBe(CHARACTER_WIDTH_RATIO)
  })

  it('does not clamp a scale small enough to stay under the ceiling', () => {
    // 0.42 × 0.5 = 0.21, nowhere near 0.45 — the clamp must not affect this.
    expect(resolveCharacterHeightRatio(0.5)).toBeCloseTo(CHARACTER_HEIGHT_RATIO * 0.5, 10)
  })

  it('clamps at exactly MAX_CHARACTER_HEIGHT_RATIO once scale pushes past it', () => {
    expect(resolveCharacterHeightRatio(1.3)).toBe(MAX_CHARACTER_HEIGHT_RATIO)
    expect(resolveCharacterHeightRatio(5)).toBe(MAX_CHARACTER_HEIGHT_RATIO) // never exceeds it, however large the scale
  })

  it('resolveCharacterWidthRatio always converts the (already-clamped) height ratio via the room aspect ratio', () => {
    for (const scale of [0.5, 1, 1.3, 5]) {
      const height = resolveCharacterHeightRatio(scale)
      const width = resolveCharacterWidthRatio(scale)
      expect(width).toBeCloseTo(height * (ROOM_CANVAS_HEIGHT / ROOM_CANVAS_WIDTH), 10)
    }
  })
})
