import type { CharacterState, Gender } from '../character/types'

/**
 * Canonical cosmetic domain model (docs/StudyLog_Cosmetic_System_PRD_v1.0.md §6/§7).
 * This is a NEW layer added on top of the existing shop/character-catalog
 * structures — it does not replace `ShopCategory` (store/shopStore.ts) or
 * `CharacterSlot` (character/catalog/types.ts), both of which stay exactly
 * as they are. See `slotAdapter.ts` for how the three vocabularies relate.
 *
 * Character slots (5 — the PRD's 4 MVP slots plus `neckAccessory`, added to
 * give `acc-necklace` its own home instead of an approximate mapping; see
 * slotAdapter.ts) + room slots (6, PRD future scope) in one enum. No
 * catalog entry exists for the room slots yet (see catalog.ts), but the
 * type is declared now so Phase 2+ room-cosmetic work doesn't need a
 * second slot enum.
 */
export type CosmeticSlot =
  | 'hair'
  | 'outfit'
  | 'headAccessory'
  | 'faceAccessory'
  /** A necklace/collar-level item (today: `acc-necklace`). Named
   * `neckAccessory` rather than reusing the existing `CharacterSlot`'s
   * `backAccessory` name — see slotAdapter.ts's doc comment — because a
   * necklace visually reads as neck-worn, and this new PRD-level enum has
   * no obligation to mirror the older name verbatim. `backAccessory`
   * (character/catalog/types.ts) is untouched; only this new mapping
   * target's name differs. */
  | 'neckAccessory'
  | 'roomTheme'
  | 'desk'
  | 'chair'
  | 'lamp'
  | 'deskProp'
  | 'pet'

/**
 * Character slots split into two groups, per
 * docs/StudyLog_Cosmetic_System_PRD_v1.0.md §6 ("required base slots
 * resolve to a default" vs "optional props/accessories may be
 * unequipped"):
 *
 * - `hair` / `outfit`: the character must always show *something* here —
 *   today that "something" is the base sprite's own baked-in default
 *   art, not a catalog entry, but the slot itself is never meant to be
 *   empty. Catalog validation checks these for a `defaultOwned` entry.
 * - `headAccessory` / `faceAccessory` / `neckAccessory`: genuinely
 *   optional — a character with nothing equipped in any of these is a
 *   normal, valid state, not a gap. Catalog validation never requires a
 *   default for these.
 */
export const REQUIRED_CHARACTER_SLOTS: readonly CosmeticSlot[] = ['hair', 'outfit']
export const OPTIONAL_CHARACTER_SLOTS: readonly CosmeticSlot[] = ['headAccessory', 'faceAccessory', 'neckAccessory']

/** `'unassigned'` is a real, explicit value — not a fallback to reach for.
 * None of the 12 existing shop items has real rarity data (no rarity
 * concept existed before this domain model), so every adapted item is
 * `'unassigned'` today (catalog.ts). Making this optional instead would
 * let a future `item.rarity ?? 'common'` silently invent a tier that was
 * never assigned; requiring callers to handle `'unassigned'` explicitly
 * does not. */
export type CosmeticRarity = 'unassigned' | 'common' | 'rare' | 'epic' | 'legendary'

export type AcquisitionType = 'default' | 'points' | 'level' | 'streak' | 'achievement' | 'event' | 'premium'

/** The 4 MVP character states with confirmed baseline art
 * (character/engine/spriteSupport.ts UNIQUE_POSE_STATES) — the only states
 * a character cosmetic can ever legitimately declare support for today. */
export type CosmeticSupportedState = Extract<CharacterState, 'idle' | 'study' | 'sleep' | 'happy'>

/**
 * Adapted from the PRD's suggested shape (§6) with two deliberate
 * deviations, both noted inline:
 *
 * - `compatibleGenders` uses the project's real `Gender` ('boy'|'girl'),
 *   not the PRD's literal 'female'|'male' — introducing a second gender
 *   vocabulary alongside the one every other file in this codebase already
 *   uses would be a real inconsistency, not a faithful adaptation.
 * - `thumbnailSrc` is optional. The PRD's Phase 4 ("Replace emoji previews
 *   with generated thumbnails") hasn't happened yet — every existing shop
 *   item's only visual today is an emoji (store/shopStore.ts). Making this
 *   field required would force fabricating a path to a file that doesn't
 *   exist, which is exactly what this phase must not do.
 */
export interface CosmeticItemDefinition {
  id: string
  name: string
  slot: CosmeticSlot
  rarity: CosmeticRarity
  acquisitionType: AcquisitionType
  pointPrice?: number
  /** Key into the existing character-catalog SVG/PNG asset registries
   * (character/catalog/assetPartsRegistry.ts, character/engine/spriteSupport.ts)
   * for character-slot items. Room-slot items have no adapted source yet
   * (see catalog.ts) and never reach this field with a real value today. */
  assetKey?: string
  thumbnailSrc?: string
  zIndex: number
  defaultOwned?: boolean
  compatibleGenders: Gender[] | 'all'
  /** Empty for every item in this phase — no cosmetic has a real
   * per-state PNG layer yet (character/engine/spriteSupport.ts
   * SUPPORTED_COSMETIC_ASSET_KEYS is empty). An empty array is the honest
   * "not yet renderable in any state" value, not an omission. */
  supportedStates: CosmeticSupportedState[]
  tags?: string[]
  availableFrom?: string
  availableUntil?: string
}

export interface InventoryEntry {
  itemId: string
  acquiredAt: string
  source: AcquisitionType
}

export type EquippedCosmetics = Partial<Record<CosmeticSlot, string>>
