import type { CharacterAssetDefinition } from './types'

/**
 * Maps every existing shop item id to an original SVG placeholder part
 * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §9). Existing ids are
 * preserved exactly — only what they render as changes (an aligned SVG
 * part instead of an emoji badge).
 *
 * Z-order (low -> high, i.e. back -> front): outfit(30) < backAccessory(28,
 * actually rendered just under the arms since it sits at the collar) <
 * headAccessory(50-55) < faceAccessory(65).
 */
export const CHARACTER_ASSET_CATALOG: CharacterAssetDefinition[] = [
  { id: 'hair-ribbon', slot: 'headAccessory', assetKey: 'ribbon', zIndex: 50 },
  { id: 'hair-straw', slot: 'headAccessory', assetKey: 'strawHat', zIndex: 52 },
  { id: 'hair-cap', slot: 'headAccessory', assetKey: 'cap', zIndex: 52 },

  { id: 'outfit-blue', slot: 'top', assetKey: 'hoodie', zIndex: 30 },
  { id: 'outfit-pink', slot: 'onePiece', assetKey: 'dress', zIndex: 30 },
  { id: 'outfit-gold', slot: 'top', assetKey: 'hoodie', zIndex: 30 },

  { id: 'acc-glasses', slot: 'faceAccessory', assetKey: 'glasses', zIndex: 65 },
  { id: 'acc-headphone', slot: 'headAccessory', assetKey: 'headphones', zIndex: 55 },
  { id: 'acc-necklace', slot: 'backAccessory', assetKey: 'necklace', zIndex: 28 },
]

export function findCatalogEntry(itemId?: string): CharacterAssetDefinition | undefined {
  if (!itemId) return undefined
  return CHARACTER_ASSET_CATALOG.find((entry) => entry.id === itemId)
}

/** Resolves a list of equipped shop item ids into their catalog entries,
 * silently dropping unknown/missing ids rather than throwing — an
 * unrecognized id (e.g. a future item not yet cataloged) must never break
 * rendering. */
export function resolveCatalogEntries(itemIds: string[] | undefined): CharacterAssetDefinition[] {
  if (!itemIds || itemIds.length === 0) return []
  return itemIds
    .map((id) => findCatalogEntry(id))
    .filter((entry): entry is CharacterAssetDefinition => Boolean(entry))
    .sort((a, b) => a.zIndex - b.zIndex)
}
