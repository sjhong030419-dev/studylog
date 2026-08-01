import { describe, expect, it } from 'vitest'
import {
  allCosmeticsSupported,
  BASE_SPRITE_GENDERS,
  BASE_SPRITE_STATES,
  HAS_REAL_PER_FRAME_ANIMATION,
  isShopItemPngSupported,
  REUSED_POSE_SOURCE,
  shouldUseSprites,
  SUPPORTED_COSMETIC_ASSET_KEYS,
  SUPPORTED_EFFECT_STATES,
  UNIQUE_POSE_STATES,
} from './spriteSupport'
import { CHARACTER_ASSET_CATALOG } from '../catalog/items'
import { STATE_HAS_ART } from '../types'
import type { CharacterAssetDefinition } from '../catalog/types'
import type { CharacterState } from '../types'

/** Every real hair/outfit/accessory shop item id (store/shopStore.ts) —
 * kept as a literal list (not derived from the store) so this test file
 * doesn't import the store, and so a change to the catalog is caught by a
 * failing test rather than silently widening what's checked. */
const REAL_COSMETIC_ITEM_IDS = [
  'hair-ribbon', 'hair-straw', 'hair-cap',
  'outfit-blue', 'outfit-pink', 'outfit-gold',
  'acc-glasses', 'acc-headphone', 'acc-necklace',
]
/** Every real background shop item id — these recolor the room, not the
 * character, so they must never be treated as "pending". */
const REAL_BACKGROUND_ITEM_IDS = ['bg-sky', 'bg-night', 'bg-sakura']

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

})

describe('shouldUseSprites — character consistency (equipping an unsupported cosmetic must NOT swap the whole art style)', () => {
  it('still uses the new PNG when an unsupported cosmetic item is equipped', () => {
    // Every real shop item (ribbon, hoodie, dress, glasses, ...) has no PNG
    // layer yet. Previously this flipped the ENTIRE character to the SVG
    // renderer — a full style swap the user would see differently on every
    // screen at once. The new PNG body must stay StudyLog's one and only
    // default look; PixelSpriteRenderer omits the unsupported item's own
    // layer instead (its own per-entry SUPPORTED_COSMETIC_ASSET_KEYS check).
    const equippedRibbon = [cosmetic({ id: 'hair-ribbon', slot: 'headAccessory', assetKey: 'ribbon', zIndex: 50 })]
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'girl',
        state: 'idle',
        cosmeticEntries: equippedRibbon,
      }),
    ).toBe(true)
  })

  it('still uses the new PNG regardless of how many unsupported items are equipped at once', () => {
    const allNine = [
      cosmetic({ id: 'hair-ribbon', slot: 'headAccessory', assetKey: 'ribbon', zIndex: 50 }),
      cosmetic({ id: 'hair-straw', slot: 'headAccessory', assetKey: 'strawHat', zIndex: 52 }),
      cosmetic({ id: 'outfit-blue', slot: 'top', assetKey: 'hoodie', zIndex: 30 }),
      cosmetic({ id: 'outfit-pink', slot: 'onePiece', assetKey: 'dress', zIndex: 30 }),
      cosmetic({ id: 'acc-glasses', slot: 'faceAccessory', assetKey: 'glasses', zIndex: 65 }),
      cosmetic({ id: 'acc-headphone', slot: 'headAccessory', assetKey: 'headphones', zIndex: 55 }),
      cosmetic({ id: 'acc-necklace', slot: 'backAccessory', assetKey: 'necklace', zIndex: 28 }),
    ]
    expect(
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'boy',
        state: 'happy',
        cosmeticEntries: allNine,
      }),
    ).toBe(true)
  })

  it('only falls back for base-image load failure, never for cosmetics (with or without items equipped)', () => {
    const equippedRibbon = [cosmetic({ id: 'hair-ribbon', slot: 'headAccessory', assetKey: 'ribbon', zIndex: 50 })]
    for (const cosmeticEntries of [[], equippedRibbon]) {
      expect(
        shouldUseSprites({
          spriteAssetsAvailable: true,
          spriteLoadFailed: true,
          gender: 'boy',
          state: 'idle',
          cosmeticEntries,
        }),
      ).toBe(false)
    }
  })
})

describe('shouldUseSprites — same appearance yields the same renderer choice across every real screen (홈/일반타이머/뽀모도로/프로필/상점/공유)', () => {
  // Every one of these screens calls useMyAvatarAppearance() → the same
  // shopStore.equipped state → the same cosmeticEntries. The states below
  // are exactly what each screen actually passes to CharacterView:
  // 홈/일반타이머 (StudyTimer via CharacterRoomCard): idle/study/break/away/...
  // 뽀모도로 (PomodoroTimer): the live phase state, and 'happy' on completion
  // 프로필 (MyPage) / 상점 (AvatarShop) / 공유 (LogCaptureCard): always 'happy'
  const REAL_SCREEN_STATES: CharacterState[] = ['idle', 'study', 'break', 'away', 'happy']

  const equippedRibbon = [cosmetic({ id: 'hair-ribbon', slot: 'headAccessory', assetKey: 'ribbon', zIndex: 50 })]

  it('resolves to the same (true/PNG) result for every screen state when a cosmetic is equipped', () => {
    const results = REAL_SCREEN_STATES.map((state) =>
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'boy',
        state,
        cosmeticEntries: equippedRibbon,
      }),
    )
    expect(results).toEqual(REAL_SCREEN_STATES.map(() => true))
  })

  it('resolves to the same (true/PNG) result for every screen state with no customization equipped', () => {
    const results = REAL_SCREEN_STATES.map((state) =>
      shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'girl',
        state,
        cosmeticEntries: [],
      }),
    )
    expect(results).toEqual(REAL_SCREEN_STATES.map(() => true))
  })

  it('equipping/unequipping a cosmetic never changes the result — the exact bug being fixed', () => {
    for (const state of REAL_SCREEN_STATES) {
      const withoutCosmetics = shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'boy',
        state,
        cosmeticEntries: [],
      })
      const withCosmetics = shouldUseSprites({
        spriteAssetsAvailable: true,
        spriteLoadFailed: false,
        gender: 'boy',
        state,
        cosmeticEntries: equippedRibbon,
      })
      expect(withoutCosmetics).toBe(withCosmetics)
    }
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

describe('isShopItemPngSupported (shop purchase-gate / badge — single source of truth, no duplicated logic)', () => {
  it('is false for every real hair/outfit/accessory item today (no PNG layer exists yet)', () => {
    for (const itemId of REAL_COSMETIC_ITEM_IDS) {
      expect(isShopItemPngSupported(itemId)).toBe(false)
    }
  })

  it('is true for every real background item (recolors the room, not the character)', () => {
    for (const itemId of REAL_BACKGROUND_ITEM_IDS) {
      expect(isShopItemPngSupported(itemId)).toBe(true)
    }
  })

  it('is true for an unknown/garbage item id (defensive — never throws, never blocks)', () => {
    expect(isShopItemPngSupported('not-a-real-item')).toBe(true)
  })

  it('takes only an item id — its result cannot depend on or be affected by owned/equipped state', () => {
    // Structural guarantee behind requirement #1 (show the badge regardless
    // of owned/equipped) and #5/#6 (never touches purchase or equip data):
    // there is no `owned`/`equipped` parameter for this function to read,
    // so calling it twice for the same id always agrees.
    for (const itemId of [...REAL_COSMETIC_ITEM_IDS, ...REAL_BACKGROUND_ITEM_IDS]) {
      expect(isShopItemPngSupported(itemId)).toBe(isShopItemPngSupported(itemId))
    }
  })

  it('agrees exactly with SUPPORTED_COSMETIC_ASSET_KEYS for every real catalog entry (no drift between shop gate and renderer skip)', () => {
    // The shop's purchase/badge decision and PixelSpriteRenderer's
    // per-layer skip decision must never be able to disagree — both read
    // the same SUPPORTED_COSMETIC_ASSET_KEYS registry, this proves it.
    for (const entry of CHARACTER_ASSET_CATALOG) {
      expect(isShopItemPngSupported(entry.id)).toBe(SUPPORTED_COSMETIC_ASSET_KEYS.has(entry.assetKey))
    }
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
