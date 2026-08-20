import { findCatalogEntry } from '../catalog/items'
import type { CharacterAssetDefinition } from '../catalog/types'
import type { CharacterState, Gender } from '../types'

/**
 * Explicit capability registry for the real PNG sprite pipeline
 * (public/sprites/avatar/). `SPRITE_ASSETS_AVAILABLE = true` in
 * spriteAssetMap.ts only means "the base sprite pipeline is wired up" — it
 * does NOT mean every gender/state/cosmetic/effect has real art. This file
 * is the single place that declares exactly what does, verified against
 * the files actually committed (docs/character-system.md §13-14). Every
 * consumer checks here rather than assuming.
 */

/** Genders with real base body PNGs under base/ — verified: both boy/ and
 * girl/ have a file for all 13 states × the state's full frame count. */
export const BASE_SPRITE_GENDERS: ReadonlySet<Gender> = new Set(['boy', 'girl'])

/** Every CharacterState with a real base sprite FILE for both genders (all
 * 13 — confirmed by file count matching STATE_FRAME_COUNT exactly, 208
 * files total). This does NOT mean every one is a visually distinct pose —
 * see `UNIQUE_POSE_STATES` below for that. */
export const BASE_SPRITE_STATES: ReadonlySet<CharacterState> = new Set([
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
])

/**
 * The 4 states with genuinely distinct, purpose-drawn art. Confirmed by
 * hashing every committed base PNG: every other declared state's file is a
 * byte-identical duplicate of one of these four. A real file exists under
 * each state's own name (so nothing 404s), but only these four are unique
 * art — the rest are documented reuse, not new poses.
 */
export const UNIQUE_POSE_STATES: ReadonlySet<CharacterState> = new Set(['idle', 'study', 'sleep', 'happy'])

/** Which unique pose each non-unique state's file currently duplicates.
 * Documentation only, not a runtime redirect — the file already exists
 * under the state's own name via `resolveBaseFramePath`. This exists so
 * the reuse can be reported honestly instead of implied to be distinct
 * art. */
export const REUSED_POSE_SOURCE: Partial<Record<CharacterState, CharacterState>> = {
  away: 'idle',
  break: 'idle',
  thinking: 'idle',
  typing: 'study',
  reading: 'study',
  focused: 'study',
  excited: 'happy',
  celebrate: 'happy',
  levelUp: 'happy',
}

/** Every "frame" within every state is byte-identical to every other frame
 * of the same state (confirmed by hashing all 208 base files) — frame
 * counts match `STATE_FRAME_COUNT` structurally (the right number of files
 * exists), but there is currently zero real per-frame animation. Do not
 * describe this as completed animation work. */
export const HAS_REAL_PER_FRAME_ANIMATION = false

/** assetKeys (character/catalog/items.ts: ribbon, strawHat, cap, hoodie,
 * dress, glasses, headphones, necklace — plus `default-hair`/`default-outfit`,
 * character/catalog/baseLayers.ts's bare-base pieces) with a real,
 * gender-and-state-complete cosmetic-layer PNG set under
 * `avatar-layers/{folder}/{assetKey}/` (spriteManifest.ts
 * `resolveCosmeticLayerPath`). Empty today — no real files exist under that
 * root yet. Populate as real layer art lands, only once every required
 * gender × state file for that assetKey is confirmed present (never
 * partial — PixelSpriteRenderer has no per-state/per-gender fallback
 * within one assetKey, only whole-layer omission); nothing else needs to
 * change (`allCosmeticsSupported` below and `shouldUseBareBase`'s
 * consumers pick it up automatically). */
export const SUPPORTED_COSMETIC_ASSET_KEYS: ReadonlySet<string> = new Set([])

/** CharacterStates with a real overlay PNG under effects/. Empty today —
 * that folder only contains `.gitkeep`. */
export const SUPPORTED_EFFECT_STATES: ReadonlySet<CharacterState> = new Set([])

/**
 * Genders with a confirmed BARE base body (no baked-in default hair/outfit)
 * under `avatar-layers/base/` (spriteManifest.ts `resolveBareBaseFramePath`)
 * — empty today, so `resolveBaseFramePath`'s existing baked-in-default base
 * stays the only base art any renderer actually requests. Once a gender is
 * added here, `PixelSpriteRenderer` switches that gender to the bare base
 * AND starts attempting `BASE_LAYER_DEFAULTS`' default-hair/default-outfit
 * layers on top of it (character/catalog/baseLayers.ts) — both the bare
 * base image itself AND its default-hair/default-outfit layers must be
 * confirmed together (add the gender here only once all three are real),
 * since a bare base with no default-hair/outfit layer would render an
 * undressed character.
 */
export const BARE_BASE_CONFIRMED_GENDERS: ReadonlySet<Gender> = new Set([])

/** The single decision `PixelSpriteRenderer` uses to choose the bare base
 * over the legacy baked-in-default base for one gender. Pure function,
 * mirrors `shouldUseSprites`/`roomThemeSupport.ts`'s `shouldUsePixelRoom`. */
export function shouldUseBareBase(gender: Gender): boolean {
  return BARE_BASE_CONFIRMED_GENDERS.has(gender)
}

/**
 * True only if every equipped cosmetic item has a real supported PNG
 * layer. No longer used to decide the PNG-vs-SVG renderer (see
 * `shouldUseSprites` below) — an unsupported item must never swap the
 * user's whole character to a different art style (docs/character-system.md
 * "캐릭터 일관성"). Still used for two things: (1) `PixelSpriteRenderer`'s
 * own per-layer skip loop, which is what actually omits an unsupported
 * item's PNG layer while everything else keeps rendering; (2) the shop UI's
 * "새 캐릭터 대응 준비 중" badge, to tell the user why an item they own
 * doesn't visually show up on the new sprite yet.
 */
export function allCosmeticsSupported(entries: CharacterAssetDefinition[]): boolean {
  return entries.every((entry) => SUPPORTED_COSMETIC_ASSET_KEYS.has(entry.assetKey))
}

/**
 * True if this shop item id would actually render on the new PNG character
 * when equipped. Background items have no character-catalog entry at all
 * (they recolor the room, not the character), so they're always considered
 * supported — only hair/outfit/accessory can be "pending". This is the one
 * shared place that answers "is this shop item PNG-ready" from a raw item
 * id — the shop (badge + purchase gate) and any future consumer must call
 * this instead of re-deriving the check, so the rule never drifts out of
 * sync with `SUPPORTED_COSMETIC_ASSET_KEYS`.
 */
export function isShopItemPngSupported(itemId: string): boolean {
  // Delivered as a complete whole-avatar combination with the sakura skin,
  // never as a runtime layer. It becomes visible when both are equipped.
  if (itemId === 'hair-ribbon') return true
  const entry = findCatalogEntry(itemId)
  if (!entry) return true
  return SUPPORTED_COSMETIC_ASSET_KEYS.has(entry.assetKey)
}

export interface SpriteUsabilityInput {
  spriteAssetsAvailable: boolean
  /** True once a real base image failed to load at runtime this session —
   * the only thing (besides gender/state coverage) that's still allowed to
   * fall back to the SVG renderer. */
  spriteLoadFailed: boolean
  gender: Gender
  state: CharacterState
  /** Kept in the input shape for callers/future use, but no longer part of
   * this decision — see the note below. */
  cosmeticEntries: CharacterAssetDefinition[]
}

/**
 * The single decision `CharacterView` uses to pick the real PNG renderer
 * over the SVG fallback. Extracted as a pure function (rather than inline
 * component logic) so every branch is independently testable — this
 * project has no component-rendering test harness, only pure-function
 * tests, so the decision itself has to be a pure function to be covered.
 *
 * Deliberately does NOT check `allCosmeticsSupported(cosmeticEntries)`
 * anymore — an unsupported hair/outfit/accessory must never swap the
 * user's entire character to a visually different art style (that was the
 * exact bug: equipping any of the 9 real shop items flipped every screen
 * from the new PNG dot character to the old SVG chibi at once). The new PNG
 * body is StudyLog's one and only default look; an unsupported item is
 * instead silently omitted by `PixelSpriteRenderer`'s own per-layer skip
 * (character/engine/spriteSupport.ts's `allCosmeticsSupported` / `SUPPORTED_COSMETIC_ASSET_KEYS`
 * still back that skip and the shop's "새 캐릭터 대응 준비 중" badge).
 */
export function shouldUseSprites({
  spriteAssetsAvailable,
  spriteLoadFailed,
  gender,
  state,
}: SpriteUsabilityInput): boolean {
  return spriteAssetsAvailable && !spriteLoadFailed && BASE_SPRITE_GENDERS.has(gender) && BASE_SPRITE_STATES.has(state)
}
