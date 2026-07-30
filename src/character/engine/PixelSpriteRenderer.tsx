import { useMemo, useState } from 'react'
import { resolveCatalogEntries } from '../catalog/items'
import {
  LAYER_TO_FOLDER,
  resolveBaseFramePath,
  resolveCosmeticFramePath,
  resolveEffectFramePath,
  resolveFaceFramePath,
  SLOT_TO_LAYER,
  SPRITE_CANVAS_SIZE,
  SPRITE_LAYER_ORDER,
  type SpriteLayer,
} from './spriteManifest'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface PixelSpriteRendererProps {
  gender: Gender
  state: CharacterState
  frame: number
  appearance: CharacterAppearance
  size: number
  /** Called once if the required `base` body layer fails to load — the
   * caller (CharacterView) is expected to fall back to ChibiFallbackArt for
   * this render. A missing cosmetic/effect layer never triggers this; it
   * just quietly omits that one layer (never a broken-image icon). */
  onBaseLayerError?: () => void
}

interface LayerImage {
  key: string
  layer: SpriteLayer
  src: string
}

/**
 * Renders the real transparent-PNG sprite stack once production art exists
 * (`SPRITE_ASSETS_AVAILABLE` in `spriteAssetMap.ts`). Not used today — with
 * no image files under `public/sprites/avatar/` yet, `CharacterView` never
 * mounts this component. It exists now so the swap is a one-line flag flip
 * later, not a rewrite (docs/character-system.md §10).
 */
export function PixelSpriteRenderer({
  gender,
  state,
  frame,
  appearance,
  size,
  onBaseLayerError,
}: PixelSpriteRendererProps) {
  const [failedLayerKeys, setFailedLayerKeys] = useState<Set<string>>(new Set())

  const cosmeticEntries = useMemo(() => resolveCatalogEntries(appearance.equippedAssetIds), [appearance])

  const images: LayerImage[] = useMemo(() => {
    const byLayer = new Map<SpriteLayer, LayerImage[]>()
    const push = (img: LayerImage) => {
      const list = byLayer.get(img.layer) ?? []
      list.push(img)
      byLayer.set(img.layer, list)
    }

    push({ key: 'base', layer: 'base', src: resolveBaseFramePath(gender, state, frame) })
    push({ key: 'face', layer: 'eyes', src: resolveFaceFramePath(gender, state, frame) })

    for (const entry of cosmeticEntries) {
      const layer = SLOT_TO_LAYER[entry.slot]
      const folder = LAYER_TO_FOLDER[layer]
      if (folder === 'hair' || folder === 'outfit' || folder === 'accessory') {
        push({ key: entry.id, layer, src: resolveCosmeticFramePath(folder, entry.assetKey) })
      }
    }

    push({ key: 'effect', layer: 'stateEffect', src: resolveEffectFramePath(state, frame) })

    return SPRITE_LAYER_ORDER.flatMap((layer) => byLayer.get(layer) ?? [])
  }, [gender, state, frame, cosmeticEntries])

  function handleError(img: LayerImage) {
    if (img.layer === 'base' && !failedLayerKeys.has(img.key)) {
      onBaseLayerError?.()
    }
    setFailedLayerKeys((prev) => new Set(prev).add(img.key))
  }

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {images
        .filter((img) => !failedLayerKeys.has(img.key))
        .map((img) => (
          <img
            key={img.key}
            src={img.src}
            alt=""
            aria-hidden="true"
            width={SPRITE_CANVAS_SIZE}
            height={SPRITE_CANVAS_SIZE}
            onError={() => handleError(img)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated',
            }}
          />
        ))}
    </div>
  )
}
