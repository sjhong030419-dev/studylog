import type { AvatarLayerFolder, SpriteLayer } from '../engine/spriteManifest'

export interface BaseLayerDefinition {
  layer: SpriteLayer
  folder: AvatarLayerFolder
  assetKey: string
}

/**
 * The "bare base" default look — the hair and outfit every character shows
 * when nothing else is equipped in that slot, once the bare base itself is
 * active (character/engine/spriteSupport.ts `shouldUseBareBase`, false for
 * every gender today). These are NOT shop items: there is nothing to
 * purchase or equip, so they don't belong in `CHARACTER_ASSET_CATALOG`
 * (character/catalog/items.ts, keyed by permanent shop item id) — they're
 * unconditional layers `PixelSpriteRenderer` attempts on its own, gated
 * the same way every other cosmetic layer is (through
 * `SUPPORTED_COSMETIC_ASSET_KEYS`), so nothing renders until real files
 * exist and get confirmed.
 *
 * `default-hair` covers both the `hairBack` and `hairFront` layer pieces
 * under one assetKey — a hairstyle is one design delivered as two occlusion
 * pieces, so it makes sense for both to activate together. `default-outfit`
 * is a separate, independently-confirmable key: an artist may finish the
 * outfit before the hair, or vice versa, and there's no reason to force
 * them to land in the same delivery.
 *
 * `PixelSpriteRenderer` suppresses a given layer's default here whenever a
 * real, supported equipped cosmetic already renders into that same
 * `SpriteLayer` — e.g. a confirmed `outfit-blue` swap replaces
 * `default-outfit`, it never stacks on top of it.
 */
export const BASE_LAYER_DEFAULTS: readonly BaseLayerDefinition[] = [
  { layer: 'hairBack', folder: 'hair-back', assetKey: 'default-hair' },
  { layer: 'hairFront', folder: 'hair-front', assetKey: 'default-hair' },
  { layer: 'outfit', folder: 'outfit', assetKey: 'default-outfit' },
]

/**
 * Which of `BASE_LAYER_DEFAULTS` should actually render right now — pulled
 * out of `PixelSpriteRenderer` as a pure function (mirrors this project's
 * established pattern: `shouldUsePixelRoom`, `shouldUseFullScene`,
 * `resolveFullSceneSwap`) so the "suppress a default once a real cosmetic
 * takes over its layer" rule is unit-testable without a DOM renderer, which
 * this project's test setup doesn't have (vite.config.ts — node
 * environment only).
 */
export function resolveActiveBaseLayerDefaults(
  equippedLayersRendering: ReadonlySet<SpriteLayer>,
  supportedAssetKeys: ReadonlySet<string>,
  defaults: readonly BaseLayerDefinition[] = BASE_LAYER_DEFAULTS,
): BaseLayerDefinition[] {
  return defaults.filter(
    (def) => !equippedLayersRendering.has(def.layer) && supportedAssetKeys.has(def.assetKey),
  )
}
