import { findCatalogEntry } from '../character/catalog/items'
import { SHOP_ITEMS } from '../store/shopStore'
import type { ShopItem } from '../types'
import { resolveCosmeticSlot } from './slotAdapter'
import type { CosmeticItemDefinition } from './types'

/**
 * Derives one `CosmeticItemDefinition` per existing shop item — adapter
 * output, not a second source of truth. `SHOP_ITEMS` (store/shopStore.ts)
 * stays the actual owned/equipped/purchase data; this is a read-only,
 * richer view over it for anything that wants the PRD's slot/rarity/
 * acquisition vocabulary (Shop UI redesign, reward reveals, catalog
 * validation) without changing how purchases or equipment work.
 *
 * An item whose slot can't be resolved (`resolveCosmeticSlot` returns
 * `undefined`) is omitted from the output, not force-mapped — this can't
 * happen for any of the 12 real items today (see catalog.test.ts), but the
 * function stays honest about it for whatever gets added to `SHOP_ITEMS`
 * next.
 */
export function buildCosmeticCatalog(items: ShopItem[]): CosmeticItemDefinition[] {
  const result: CosmeticItemDefinition[] = []

  for (const item of items) {
    const slot = resolveCosmeticSlot(item)
    if (!slot) continue

    const characterEntry = findCatalogEntry(item.id)

    result.push({
      id: item.id,
      name: item.name,
      slot,
      // No existing data source has a rarity concept — 'unassigned' says so
      // explicitly (types.ts) rather than defaulting to a real tier like
      // 'common', which would misrepresent a design decision that hasn't
      // been made yet. Do not surface rarity in any UI until real values
      // are assigned.
      rarity: 'unassigned',
      acquisitionType: item.priceType === 'cash' ? 'premium' : 'points',
      pointPrice: item.priceType === 'points' ? item.price : undefined,
      assetKey: characterEntry?.assetKey,
      // No production thumbnail pipeline exists yet (PRD Phase 4) — left
      // undefined rather than pointing at a file that doesn't exist.
      thumbnailSrc: undefined,
      zIndex: characterEntry?.zIndex ?? 0,
      // None of the 12 real items are free/starter items today — every one
      // requires a purchase. Documented, not silently defaulted to true.
      defaultOwned: false,
      compatibleGenders: 'all',
      // Empty for every item: character/engine/spriteSupport.ts's
      // SUPPORTED_COSMETIC_ASSET_KEYS is empty, so no cosmetic has a real
      // per-state PNG layer yet — see types.ts's doc comment on this field.
      supportedStates: [],
    })
  }

  return result
}

/** The real, derived catalog — built once from the actual shop items so
 * every consumer sees the same data instead of re-deriving it. */
export const COSMETIC_CATALOG: CosmeticItemDefinition[] = buildCosmeticCatalog(SHOP_ITEMS)
