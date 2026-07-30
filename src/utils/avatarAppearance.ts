import type { ShopCategory, ShopItem } from '../types'
import type { CharacterAppearance } from '../character/types'

/** Resolves the existing shop's owned/equipped item ids into a partial
 * character appearance override (docs/character-system.md,
 * docs/StudyLog_Character_System_Fix_PRD_v1.0.md §7/§9). Only overrides
 * what the shop actually knows about — everything else falls back to the
 * gender preset's defaults. Unknown/missing equipped ids are simply
 * omitted, never thrown. */
export function resolveAvatarAppearance(
  items: ShopItem[],
  equipped: Partial<Record<ShopCategory, string>>,
): Partial<CharacterAppearance> {
  const outfit = items.find((i) => i.id === equipped.outfit)
  const background = items.find((i) => i.id === equipped.background)

  const equippedAssetIds = [equipped.hair, equipped.outfit, equipped.accessory].filter(
    (id): id is string => Boolean(id),
  )

  return {
    outfitColor: outfit?.colorHex,
    backgroundColor: background?.colorHex,
    equippedAssetIds,
  }
}
