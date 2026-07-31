import { describe, expect, it } from 'vitest'
import {
  allCosmeticsSupported,
  BASE_SPRITE_GENDERS,
  BASE_SPRITE_STATES,
  HAS_REAL_PER_FRAME_ANIMATION,
  REUSED_POSE_SOURCE,
  shouldUseSprites,
  SUPPORTED_COSMETIC_ASSET_KEYS,
  SUPPORTED_EFFECT_STATES,
  UNIQUE_POSE_STATES,
} from './spriteSupport'
import { STATE_HAS_ART } from '../types'
import type { CharacterAssetDefinition } from '../catalog/types'
import type { CharacterState } from '../types'

function cosmetic(partial: Partial<CharacterAssetDefinition> & Pick<CharacterAssetDefinition, 'assetKey'>): CharacterAssetDefinition {
  return { id: 'test-item', slot: 'top', zIndex: 30, ...partial }
}

const ALL_STATES: CharacterState[] = [
  'idle',
  'study',
  'thinking',
  'reading',
  'typing',
  'break',
  'sleep',
  'happy',
  'excited',
  'celebrate',
  'levelUp',
  'focused',
  'away',
]

describe('shouldUseSprites — default (no customization) character', () => {
  it('uses the new PNG for the default boy', () => {
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'boy',
        state: 'idle',
        cosmeticEntries: [],
      }),
    ).toBe(true)
  })

  it('uses the new PNG for the default girl', () => {
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'girl',
        state: 'study',
        cosmeticEntries: [],
      }),
    ).toBe(true)
  })
})

describe('shouldUseSprites — falls back to the SVG renderer', () => {
  it('falls back when the sprite pipeline is unavailable (represents "no base sprite")', () => {
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: false,
        spriteLoadFailed: false,
        gender: 'boy',
        state: 'idle',
        cosmeticEntries: [],
      }),
    ).toBe(false)
  })

  it('falls back once a base image has failed to load at runtime', () => {
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: true,
        gender: 'boy',
        state: 'idle',
        cosmeticEntries: [],
      }),
    ).toBe(false)
  })

  it('falls back to the SVG renderer when an unsupported cosmetic item is equipped', () => {
    // Every real shop item (ribbon, hoodie, dress, glasses, ...) has no PNG
    // layer yet — equipping any of them must not render the bare PNG base
    // with the item silently missing.
    const equippedRibbon = [cosmetic({ id: 'hair-ribbon', slot: 'headAccessory', assetKey: 'ribbon', zIndex: 50 })]
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'girl',
        state: 'idle',
        cosmeticEntries: equippedRibbon,
      }),
    ).toBe(false)
  })
})

describe('allCosmeticsSupported', () => {
  it('is vacuously true for no equipped items', () => {
    expect(allCosmeticsSupported([])).toBe(true)
  })

  it('is false if any equipped item lacks a supported PNG layer', () => {
    const entries = [cosmetic({ assetKey: 'hoodie' }), cosmetic({ assetKey: 'glasses' })]
    expect(allCosmeticsSupported(entries)).toBe(false)
  })

  it('does not mutate or drop the equipped entries it is given (data preserved)', () => {
    // The decision to fall back must never alter the caller's equipped-item
    // data — the SVG fallback path receives the exact same appearance/
    // equippedAssetIds and renders every item correctly.
    const entries = [cosmetic({ id: 'outfit-blue', assetKey: 'hoodie' })]
    const before = JSON.stringify(entries)
    allCosmeticsSupported(entries)
    expect(JSON.stringify(entries)).toBe(before)
  })
})

describe('BASE_SPRITE_GENDERS / BASE_SPRITE_STATES (verified against committed files)', () => {
  it('supports both genders', () => {
    expect(BASE_SPRITE_GENDERS.has('boy')).toBe(true)
    expect(BASE_SPRITE_GENDERS.has('girl')).toBe(true)
  })

  it('has a base sprite file declared for every CharacterState', () => {
    for (const state of ALL_STATES) {
      expect(BASE_SPRITE_STATES.has(state)).toBe(true)
    }
  })
})

describe('every state has a safe rendering path (no broken image on any state change)', () => {
  it('every state either has real/reused base sprite support or a working SVG fallback', () => {
    for (const state of ALL_STATES) {
      const spriteSafe = BASE_SPRITE_STATES.has(state)
      const svgSafe = STATE_HAS_ART[state]
      expect(spriteSafe || svgSafe).toBe(true)
    }
  })
})

describe('UNIQUE_POSE_STATES vs REUSED_POSE_SOURCE (real vs temporary poses, honestly distinguished)', () => {
  it('declares exactly the 4 genuinely distinct poses', () => {
    expect(UNIQUE_POSE_STATES.size).toBe(4)
    expect(UNIQUE_POSE_STATES.has('idle')).toBe(true)
    expect(UNIQUE_POSE_STATES.has('study')).toBe(true)
    expect(UNIQUE_POSE_STATES.has('sleep')).toBe(true)
    expect(UNIQUE_POSE_STATES.has('happy')).toBe(true)
  })

  it('maps every non-unique state to one of the 4 unique poses', () => {
    for (const state of ALL_STATES) {
      if (UNIQUE_POSE_STATES.has(state)) continue
      const source = REUSED_POSE_SOURCE[state]
      expect(source).toBeDefined()
      expect(UNIQUE_POSE_STATES.has(source as CharacterState)).toBe(true)
    }
  })

  it('does not claim real per-frame animation exists yet', () => {
    expect(HAS_REAL_PER_FRAME_ANIMATION).toBe(false)
  })
})

describe('honest current gaps (regression guards — should start failing loudly once real assets land)', () => {
  it('has no supported cosmetic layers yet', () => {
    expect(SUPPORTED_COSMETIC_ASSET_KEYS.size).toBe(0)
  })

  it('has no supported effect overlays yet', () => {
    expect(SUPPORTED_EFFECT_STATES.size).toBe(0)
  })
})
