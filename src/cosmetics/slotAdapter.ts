import { findCatalogEntry } from '../character/catalog/items'
import type { CharacterSlot } from '../character/catalog/types'
import type { ShopCategory, ShopItem } from '../types'
import type { CosmeticSlot } from './types'

/**
 * Maps every existing `CharacterSlot` (character/catalog/types.ts, 19
 * values — the render-order vocabulary `PixelSpriteRenderer`/the SVG
 * fallback already use) onto the newer, PRD-derived `CosmeticSlot` values.
 * `undefined` means "no CosmeticSlot covers this yet" — an honest gap, not
 * a bug to paper over with a wrong mapping.
 *
 * `backAccessory` (today: only `acc-necklace`) maps to `neckAccessory`, its
 * own dedicated slot — not folded into `faceAccessory`. A necklace and
 * glasses are unrelated items that happen to both be tagged "accessory" in
 * the old flat `ShopCategory`; treating them as the same `CosmeticSlot`
 * would make it impossible to equip both independently once room/character
 * items are actually keyed off this enum (types.ts).
 */
const CHARACTER_SLOT_TO_COSMETIC_SLOT: Partial<Record<CharacterSlot, CosmeticSlot>> = {
  headAccessory: 'headAccessory',
  faceAccessory: 'faceAccessory',
  backAccessory: 'neckAccessory',
  top: 'outfit',
  onePiece: 'outfit',
  outerwear: 'outfit',
  hairFront: 'hair',
  hairBack: 'hair',
}

/** `ShopCategory` (store/shopStore.ts, 6 values) fallback used only when an
 * item has no `CharacterAssetDefinition` at all — today that's the 3
 * `background` items (never part of the character catalog; they recolor
 * the room, not the character) and `hair-color-black` (a whole-avatar item —
 * character/engine/wholeAvatarSupport.ts — with no `CharacterAssetDefinition`
 * either, since it never goes through the layered-cosmetic renderer this
 * catalog was originally built around). `hairColor` items map to the
 * `hair` CosmeticSlot: `hair` had zero real occupants before this (the 3
 * "hair"-category shop items are actually head accessories — see
 * `CHARACTER_SLOT_TO_COSMETIC_SLOT` above), and a hair *color* is the
 * closest fit for that slot's original intent. */
const SHOP_CATEGORY_FALLBACK: Partial<Record<ShopCategory, CosmeticSlot>> = {
  background: 'roomTheme',
  hairColor: 'hair',
  skin: 'outfit',
}

/**
 * Resolves one existing shop item to a PRD `CosmeticSlot`, preferring the
 * more granular `CharacterAssetDefinition.slot` (character/catalog/items.ts)
 * when one exists, falling back to the coarser `ShopCategory` otherwise.
 * Returns `undefined` — never throws, never guesses — for an item this
 * phase genuinely has no mapping for, so callers can skip it with a
 * recorded gap instead of fabricating a slot.
 */
export function resolveCosmeticSlot(item: ShopItem): CosmeticSlot | undefined {
  const characterEntry = findCatalogEntry(item.id)
  if (characterEntry) return CHARACTER_SLOT_TO_COSMETIC_SLOT[characterEntry.slot]
  return SHOP_CATEGORY_FALLBACK[item.category]
}
