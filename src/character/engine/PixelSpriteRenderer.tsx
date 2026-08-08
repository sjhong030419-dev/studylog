import { useMemo, useState } from 'react'
import { resolveCatalogEntries } from '../catalog/items'
import { resolveActiveBaseLayerDefaults } from '../catalog/baseLayers'
import {
  CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER,
  resolveBareBaseFramePath,
  resolveBaseFramePath,
  resolveCosmeticLayerPath,
  resolveEffectFramePath,
  SLOT_TO_LAYER,
  SPRITE_CANVAS_SIZE,
  SPRITE_LAYER_ORDER,
  type SpriteLayer,
} from './spriteManifest'
import { shouldUseBareBase, SUPPORTED_COSMETIC_ASSET_KEYS, SUPPORTED_EFFECT_STATES } from './spriteSupport'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface PixelSpriteRendererProps {
  gender: Gender
  state: CharacterState
  frame: number
  appearance: CharacterAppearance
  size: number
  /** See CharacterView's `fit` prop doc — 'width' (default) sizes this
   * root div from `size`px; 'height' fills a definite ancestor height
   * instead (PixelRoomRenderer). */
  fit?: 'width' | 'height'
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
 * Renders the real transparent-PNG sprite stack. `CharacterView` mounts
 * this for every gender/state it has real base art for, regardless of what
 * cosmetics are equipped — the new PNG body is StudyLog's one and only
 * default character style, never conditionally swapped for the SVG
 * renderer just because an item lacks a PNG layer (`spriteSupport.ts`
 * `shouldUseSprites`). Any equipped item without a supported PNG layer is
 * simply omitted below, not rendered as a broken image and not a reason to
 * fall back. Approved base portraits already include default hair/outfit
 * baked in (docs/character-system.md §14), so the `face/` layer from the
 * original 10-layer design isn't drawn here — it was never delivered as a
 * separate asset and would always 404.
 */
export function PixelSpriteRenderer({
  gender,
  state,
  frame,
  appearance,
  size,
  fit = 'width',
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

    // Bare base (character/engine/spriteSupport.ts shouldUseBareBase) is
    // false for every gender today, so this always takes the existing
    // baked-in-default base — zero change from before this file's Phase 2
    // prep work. Once a gender's bare base + default-hair/default-outfit
    // layers are all confirmed together, that gender switches here.
    const useBareBase = shouldUseBareBase(gender)
    push({
      key: 'base',
      layer: 'base',
      src: useBareBase ? resolveBareBaseFramePath(gender, state) : resolveBaseFramePath(gender, state, frame),
    })

    // This is now the ONLY place an unsupported cosmetic gets handled —
    // CharacterView mounts this renderer regardless of what's equipped (the
    // new PNG body is the one and only default look), so an item with no
    // real PNG layer is simply omitted here rather than causing the whole
    // character to fall back to the SVG renderer. Also means this component
    // never issues a network request for a file it already knows 404s.
    const equippedLayersRendering = new Set<SpriteLayer>()
    for (const entry of cosmeticEntries) {
      if (!SUPPORTED_COSMETIC_ASSET_KEYS.has(entry.assetKey)) continue
      const layer = SLOT_TO_LAYER[entry.slot]
      const folder = CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER[entry.slot]
      if (!folder) continue
      equippedLayersRendering.add(layer)
      push({ key: entry.id, layer, src: resolveCosmeticLayerPath(folder, entry.assetKey, gender, state) })
    }

    // BASE_LAYER_DEFAULTS (character/catalog/baseLayers.ts) are only ever
    // attempted alongside the bare base — the legacy baked-in base already
    // has its own default hair/outfit painted in, so stacking these on top
    // of THAT would double-draw. resolveActiveBaseLayerDefaults skips a
    // default whenever a real, supported cosmetic already renders into the
    // same SpriteLayer (e.g. a confirmed outfit swap replaces
    // default-outfit, never stacks under it).
    if (useBareBase) {
      for (const def of resolveActiveBaseLayerDefaults(equippedLayersRendering, SUPPORTED_COSMETIC_ASSET_KEYS)) {
        push({
          key: `default-${def.layer}`,
          layer: def.layer,
          src: resolveCosmeticLayerPath(def.folder, def.assetKey, gender, state),
        })
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

  // fit='width' (default, every existing caller): width is the literal
  // `size`px (always definite — never a bare percentage), with
  // max-width:100% as a *safe* responsive clamp — when the ancestor's
  // width is indefinite (the shrink-to-fit flex layout every non-room
  // screen uses), max-width:100% safely resolves to "no constraint"
  // instead of collapsing the box (a bare `width:100%` there collapses to
  // 0 — a real regression this replaced).
  //
  // fit='height' (PixelRoomRenderer only): height:100% fills whatever
  // definite height its ancestor gives it, width is derived from that via
  // aspect-ratio and capped at 100% of the ancestor's width so a narrow
  // room can never force distortion or horizontal overflow.
  const boxStyle =
    fit === 'height'
      ? { position: 'relative' as const, height: '100%', width: 'auto', maxWidth: '100%', aspectRatio: '1 / 1' }
      : { position: 'relative' as const, width: size, maxWidth: '100%', aspectRatio: '1 / 1' }

  return (
    <div style={boxStyle}>
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
