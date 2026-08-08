import { ROOM_ASSET_MANIFEST, type RoomLayerAsset, type RoomThemeId } from './roomAssetManifest'
import type { CharacterState } from '../types'

/**
 * Explicit capability registry for the real pixel room pipeline
 * (public/sprites/room/) — the room-scene equivalent of
 * character/engine/spriteSupport.ts. A layer path existing in
 * roomAssetManifest.ts only means "this is where the file would go if it
 * existed"; this file is the single place that declares which files are
 * actually real, verified against what's committed. All default-night room
 * layers are delivered; RoomScene still uses its safe fallback only because
 * ROOM_AVATAR_COMPOSITION_READY guards the legacy desk-baked avatar.
 *
 * Keyed per theme (not a single flat Set) so two themes can each declare a
 * layer with the same id (e.g. both have a "background") without one
 * theme's confirmed art making the other theme look ready too — confirming
 * a layer for `default-night` must never affect any other theme's
 * readiness.
 */
export const CONFIRMED_ROOM_LAYER_IDS: Partial<Record<RoomThemeId, ReadonlySet<string>>> = {
  'default-night': new Set([
    'background',
    'rug',
    'window-night',
    'shelf',
    'desk-back',
    'desk-front',
    'desk-front-study',
    'lamp',
    'books',
    'mug',
    'stationery',
    'study-tools',
    'study-hands',
    'desk-prop-plant-pot',
    'plant',
    'cat',
    'foreground',
    'lamp-glow',
  ]),
}

/**
 * Room art is complete, but the shipped study avatar still contains legacy
 * desk/book pixels. Keep the renderer off until the approved bare avatar
 * layers land; otherwise the room would visibly draw two desks.
 */
export const ROOM_AVATAR_COMPOSITION_READY = false

function confirmedLayerIdsFor(
  themeId: string,
  confirmedLayerIds: Partial<Record<string, ReadonlySet<string>>>,
): ReadonlySet<string> {
  return confirmedLayerIds[themeId] ?? new Set()
}

/** A layer is "required" (must exist for its theme to be usable at all) if
 * it's part of the always-on baseline scene — i.e. not gated behind a level
 * or a shop item, both of which are allowed to be silently absent (same
 * rule as an unsupported cosmetic layer in the character system: optional
 * layers degrade gracefully, required ones don't).
 *
 * `manifest` defaults to the real ROOM_ASSET_MANIFEST — the parameter only
 * exists so tests can exercise theme-isolation with synthetic multi-theme
 * fixtures without inventing a second real production theme (this app only
 * has one approved reference concept today, docs/assets/study-room-approved-v1.png). */
export function getRequiredLayers(
  themeId: string,
  manifest: Partial<Record<string, RoomLayerAsset[]>> = ROOM_ASSET_MANIFEST,
): RoomLayerAsset[] {
  return (manifest[themeId] ?? []).filter((layer) => layer.minLevel === undefined && layer.shopItemId === undefined)
}

/** True only if every required (non level/shop-gated) layer for this theme
 * has a real, confirmed file *for that same theme*. A theme with zero
 * declared layers is never "ready" — there is nothing to render. An
 * undeclared theme id always resolves to an empty confirmed set, so it's
 * always unready too. */
export function isRoomThemeReady(
  themeId: RoomThemeId,
  options?: {
    manifest?: Partial<Record<string, RoomLayerAsset[]>>
    confirmedLayerIds?: Partial<Record<string, ReadonlySet<string>>>
  },
): boolean {
  const manifest = options?.manifest ?? ROOM_ASSET_MANIFEST
  const confirmedLayerIds = options?.confirmedLayerIds ?? CONFIRMED_ROOM_LAYER_IDS
  const required = getRequiredLayers(themeId, manifest)
  if (required.length === 0) return false
  const confirmed = confirmedLayerIdsFor(themeId, confirmedLayerIds)
  return required.every((layer) => confirmed.has(layer.id))
}

export interface ResolveActiveLayersInput {
  level: number
  /** Ids of currently-equipped shop items, checked against each layer's
   * optional `shopItemId` gate. No real layer uses this field yet (see
   * roomAssetManifest.ts) — passing an empty array is correct today. */
  equippedShopItemIds: string[]
  /** Current character state — checked against each layer's optional
   * `excludeStates`/`onlyStates` gate (today only `desk-front` /
   * `desk-front-study` use this, to avoid double-drawing a desk under the
   * `study` sprite's own baked-in desk — see roomAssetManifest.ts). */
  state: CharacterState
}

/** Every layer for `themeId` that should actually render right now — level
 * gate, shop-item gate, and state gate all applied, sorted by zIndex
 * ascending so a naive DOM-order renderer would already stack correctly
 * even without relying on CSS z-index. Does NOT filter by
 * CONFIRMED_ROOM_LAYER_IDS — callers only reach this after
 * `isRoomThemeReady` already gated the whole theme, and PixelRoomRenderer
 * still handles a per-layer runtime 404 via onError, same as
 * PixelSpriteRenderer does for cosmetics. */
export function resolveActiveLayers(
  themeId: RoomThemeId,
  { level, equippedShopItemIds, state }: ResolveActiveLayersInput,
): RoomLayerAsset[] {
  const layers = ROOM_ASSET_MANIFEST[themeId] ?? []
  return layers
    .filter((layer) => layer.minLevel === undefined || level >= layer.minLevel)
    .filter((layer) => layer.shopItemId === undefined || equippedShopItemIds.includes(layer.shopItemId))
    .filter((layer) => layer.excludeStates === undefined || !layer.excludeStates.includes(state))
    .filter((layer) => layer.onlyStates === undefined || layer.onlyStates.includes(state))
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
  return ROOM_AVATAR_COMPOSITION_READY && isRoomThemeReady(themeId) && !pixelRoomLoadFailed
}
