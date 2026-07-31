import { useMemo, useState } from 'react'
import { resolveCatalogEntries } from '../catalog/items'
import {
  LAYER_TO_FOLDER,
  resolveBaseFramePath,
  resolveCosmeticFramePath,
  resolveEffectFramePath,
  SLOT_TO_LAYER,
  SPRITE_CANVAS_SIZE,
  SPRITE_LAYER_ORDER,
  type SpriteLayer,
} from './spriteManifest'
import { SUPPORTED_COSMETIC_ASSET_KEYS, SUPPORTED_EFFECT_STATES } from './spriteSupport'
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
 * Renders the real transparent-PNG sprite stack. `CharacterView` only
 * mounts this when the current look is fully representable — real base art
 * for this gender/state, and every equipped cosmetic has a supported PNG
 * layer (`spriteSupport.ts`). Approved base portraits already include
 * default hair/outfit baked in (docs/character-system.md §14), so the
 * `face/` layer from the original 10-layer design isn't drawn here — it
 * was never delivered as a separate asset and would always 404.
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

    // CharacterView already refuses to reach this component unless every
    // equipped item is supported, but this loop stays support-gated too —
    // defense in depth, and it means this component never issues a
    // network request for a file it already knows doesn't exist.
    for (const entry of cosmeticEntries) {
      if (!SUPPORTED_COSMETIC_ASSET_KEYS.has(entry.assetKey)) continue
      const layer = SLOT_TO_LAYER[entry.slot]
      const folder = LAYER_TO_FOLDER[layer]
      if (folder === 'hair' || folder === 'outfit' || folder === 'accessory') {
        push({ key: entry.id, layer, src: resolveCosmeticFramePath(folder, entry.assetKey) })
      }
    }

    if (SUPPORTED_EFFECT_STATES.has(state)) {
      push({ key: 'effect', layer: 'stateEffect', src: resolveEffectFramePath(state, frame) })
    }

    return SPRITE_LAYER_ORDER.flatMap((layer) => byLayer.get(layer) ?? [])
  }, [gender, state, frame, cosmeticEntries])

  function handleError(img: LayerImage) {
    if (img.layer === 'base' && !failedLayerKeys.has(img.key)) {
      onBaseLayerError?.()
    }
    setFailedLayerKeys((prev) => new Set(prev).add(img.key))
  }

  return (
    // width is the literal `size`px (always definite — never a bare
    // percentage), with max-width:100% as a *safe* responsive clamp: when
    // an ancestor gives this box a real (smaller) definite width — e.g.
    // PixelRoomRenderer's percentage-width wrapper — max-width correctly
    // shrinks it to fit; when the ancestor's width is indefinite (the
    // shrink-to-fit flex layout every existing non-room screen uses),
    // max-width:100% safely resolves to "no constraint" instead of
    // collapsing the box (a bare `width:100%` there collapses to 0 — a real
    // regression this replaced). aspectRatio keeps it square either way.
    <div style={{ position: 'relative', width: size, maxWidth: '100%', aspectRatio: '1 / 1' }}>
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
