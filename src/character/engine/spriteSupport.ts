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
 * dress, glasses, headphones, necklace) with a real cosmetic-layer PNG
 * under hair/, outfit/, or accessory/. Empty today — those three folders
 * only contain `.gitkeep`. Populate as real layer art lands; nothing else
 * needs to change (`allCosmeticsSupported` below picks it up automatically). */
export const SUPPORTED_COSMETIC_ASSET_KEYS: ReadonlySet<string> = new Set([])

/** CharacterStates with a real overlay PNG under effects/. Empty today —
 * that folder only contains `.gitkeep`. */
export const SUPPORTED_EFFECT_STATES: ReadonlySet<CharacterState> = new Set([])

/**
 * True only if every equipped cosmetic item has a real supported PNG
 * layer. An empty list is vacuously supported (no customization equipped,
 * nothing to lose) — this is what lets an un-customized boy/girl show the
 * new sprite while anyone with an unsupported hair/outfit/accessory
 * equipped safely falls back to the SVG renderer instead of that item
 * silently disappearing.
 */
export function allCosmeticsSupported(entries: CharacterAssetDefinition[]): boolean {
  return entries.every((entry) => SUPPORTED_COSMETIC_ASSET_KEYS.has(entry.assetKey))
}

export interface SpriteUsabilityInput {
  spriteAssetsAvailable: boolean
  /** True once a real base image failed to load at runtime this session —
   * a defense-in-depth signal on top of the static registries below. */
  spriteLoadFailed: boolean
  gender: Gender
  state: CharacterState
  cosmeticEntries: CharacterAssetDefinition[]
}

/**
 * The single decision `CharacterView` uses to pick the real PNG renderer
 * over the SVG fallback. Extracted as a pure function (rather than inline
 * component logic) so every branch is independently testable — this
 * project has no component-rendering test harness, only pure-function
 * tests, so the decision itself has to be a pure function to be covered.
 */
export function shouldUseSprites({
  spriteAssetsAvailable,
  spriteLoadFailed,
  gender,
  state,
  cosmeticEntries,
}: SpriteUsabilityInput): boolean {
  return (
    spriteAssetsAvailable &&
    !spriteLoadFailed &&
    BASE_SPRITE_GENDERS.has(gender) &&
    BASE_SPRITE_STATES.has(state) &&
    allCosmeticsSupported(cosmeticEntries)
  )
}
