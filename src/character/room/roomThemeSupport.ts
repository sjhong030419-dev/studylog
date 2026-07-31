import { ROOM_ASSET_MANIFEST, type RoomLayerAsset, type RoomThemeId } from './roomAssetManifest'

/**
 * Explicit capability registry for the real pixel room pipeline
 * (public/sprites/room/) — the room-scene equivalent of
 * character/engine/spriteSupport.ts. A layer path existing in
 * roomAssetManifest.ts only means "this is where the file would go if it
 * existed"; this file is the single place that declares which files are
 * actually real, verified against what's committed. Empty today: no PNG
 * layer for any theme has been produced yet, so every theme is unready and
 * RoomScene keeps using the existing SVG room (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md).
 */
export const CONFIRMED_ROOM_LAYER_IDS: ReadonlySet<string> = new Set([])

/** A layer is "required" (must exist for its theme to be usable at all) if
 * it's part of the always-on baseline scene — i.e. not gated behind a level
 * or a shop item, both of which are allowed to be silently absent (same
 * rule as an unsupported cosmetic layer in the character system: optional
 * layers degrade gracefully, required ones don't). */
export function getRequiredLayers(themeId: RoomThemeId): RoomLayerAsset[] {
  return (ROOM_ASSET_MANIFEST[themeId] ?? []).filter((layer) => layer.minLevel === undefined && layer.shopItemId === undefined)
}

/** True only if every required (non level/shop-gated) layer for this theme
 * has a real, confirmed file. A theme with zero declared layers is never
 * "ready" — there is nothing to render. */
export function isRoomThemeReady(themeId: RoomThemeId): boolean {
  const required = getRequiredLayers(themeId)
  if (required.length === 0) return false
  return required.every((layer) => CONFIRMED_ROOM_LAYER_IDS.has(layer.id))
}

export interface ResolveActiveLayersInput {
  level: number
  /** Ids of currently-equipped shop items, checked against each layer's
   * optional `shopItemId` gate. No real layer uses this field yet (see
   * roomAssetManifest.ts) — passing an empty array is correct today. */
  equippedShopItemIds: string[]
}

/** Every layer for `themeId` that should actually render right now — level
 * gate and shop-item gate both applied, sorted by zIndex ascending so a
 * naive DOM-order renderer would already stack correctly even without
 * relying on CSS z-index. Does NOT filter by CONFIRMED_ROOM_LAYER_IDS —
 * callers only reach this after `isRoomThemeReady` already gated the whole
 * theme, and PixelRoomRenderer still handles a per-layer runtime 404 via
 * onError, same as PixelSpriteRenderer does for cosmetics. */
export function resolveActiveLayers(themeId: RoomThemeId, { level, equippedShopItemIds }: ResolveActiveLayersInput): RoomLayerAsset[] {
  const layers = ROOM_ASSET_MANIFEST[themeId] ?? []
  return layers
    .filter((layer) => layer.minLevel === undefined || level >= layer.minLevel)
    .filter((layer) => layer.shopItemId === undefined || equippedShopItemIds.includes(layer.shopItemId))
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
}

export interface ShouldUsePixelRoomInput {
  themeId: RoomThemeId
  /** True once a required layer failed to load at runtime this session —
   * defense-in-depth on top of the static CONFIRMED_ROOM_LAYER_IDS check,
   * same pattern as CharacterView's spriteLoadFailed. */
  pixelRoomLoadFailed: boolean
}

/** The single decision RoomScene uses to pick PixelRoomRenderer over
 * LegacySvgRoomRenderer. Pure function so every branch is independently
 * testable, matching character/engine/spriteSupport.ts's shouldUseSprites. */
export function shouldUsePixelRoom({ themeId, pixelRoomLoadFailed }: ShouldUsePixelRoomInput): boolean {
  return isRoomThemeReady(themeId) && !pixelRoomLoadFailed
}
