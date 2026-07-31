import { useMemo, useState } from 'react'
import { CharacterView } from '../components/CharacterView'
import {
  CHARACTER_TOP_RATIO,
  resolveCharacterHeightRatio,
  ROOM_CANVAS_HEIGHT,
  ROOM_CANVAS_WIDTH,
  ROOM_CHARACTER_SIZE_CAP,
  ROOM_CHARACTER_Z_INDEX,
  type RoomLayerAsset,
  type RoomLayerGroup,
  type RoomThemeId,
} from './roomAssetManifest'
import { resolveActiveLayers } from './roomThemeSupport'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface PixelRoomRendererProps {
  themeId: RoomThemeId
  state: CharacterState
  gender?: Gender
  appearance?: Partial<CharacterAppearance>
  level: number
  animated?: boolean
  characterScale?: number
  /** No real shop item gates any layer today (roomAssetManifest.ts) —
   * callers pass an empty array; this is forward wiring for when a real
   * purchasable room prop exists. */
  equippedShopItemIds?: string[]
  /** Called once if a required (non level/shop-gated) layer fails to load —
   * the caller (RoomScene) is expected to fall back to
   * LegacySvgRoomRenderer for this render, same contract as
   * PixelSpriteRenderer's onBaseLayerError for the character. An optional
   * layer failing (level- or shop-gated) never triggers this; it just
   * quietly omits that one layer. */
  onCriticalLayerError?: () => void
}

const GROUP_ORDER: RoomLayerGroup[] = ['background', 'behindCharacter', 'deskFront', 'foreground', 'lighting']

/**
 * Renders the real transparent-PNG room layer stack (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md).
 * RoomScene only mounts this once roomThemeSupport.shouldUsePixelRoom says
 * the theme's required layers are real — every optional (level/shop-gated)
 * layer still degrades to "silently omitted" rather than a broken image if
 * it individually 404s, matching PixelSpriteRenderer's per-layer contract
 * for the character.
 */
export function PixelRoomRenderer({
  themeId,
  state,
  gender = 'boy',
  appearance,
  level,
  animated,
  characterScale = 1,
  equippedShopItemIds = [],
  onCriticalLayerError,
}: PixelRoomRendererProps) {
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())

  const layers = useMemo(
    () => resolveActiveLayers(themeId, { level, equippedShopItemIds }),
    [themeId, level, equippedShopItemIds],
  )

  const byGroup = useMemo(() => {
    const map = new Map<RoomLayerGroup, RoomLayerAsset[]>()
    for (const layer of layers) {
      const list = map.get(layer.group) ?? []
      list.push(layer)
      map.set(layer.group, list)
    }
    return map
  }, [layers])

  function handleError(layer: RoomLayerAsset) {
    setFailedIds((prev) => new Set(prev).add(layer.id))
    // Only a required (unconditional) layer failing at runtime is critical —
    // a level/shop-gated prop missing is an expected, silent gap.
    if (layer.minLevel === undefined && layer.shopItemId === undefined) {
      onCriticalLayerError?.()
    }
  }

  function renderGroup(group: RoomLayerGroup) {
    return (byGroup.get(group) ?? [])
      .filter((layer) => !failedIds.has(layer.id))
      .map((layer) => (
        <img
          key={layer.id}
          src={layer.src}
          alt=""
          aria-hidden="true"
          onError={() => handleError(layer)}
          style={
            layer.anchor
              ? {
                  position: 'absolute',
                  left: `${(layer.anchor.x / ROOM_CANVAS_WIDTH) * 100}%`,
                  top: `${(layer.anchor.y / ROOM_CANVAS_HEIGHT) * 100}%`,
                  width: layer.width ? `${(layer.width / ROOM_CANVAS_WIDTH) * 100}%` : undefined,
                  height: layer.height ? `${(layer.height / ROOM_CANVAS_HEIGHT) * 100}%` : undefined,
                  zIndex: layer.zIndex,
                  imageRendering: 'pixelated',
                }
              : {
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: layer.zIndex,
                  imageRendering: 'pixelated',
                }
          }
        />
      ))
  }

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ aspectRatio: `${ROOM_CANVAS_WIDTH} / ${ROOM_CANVAS_HEIGHT}` }}>
      {GROUP_ORDER.filter((g) => g !== 'deskFront' && g !== 'foreground' && g !== 'lighting').map((g) => (
        <div key={g}>{renderGroup(g)}</div>
      ))}

      {/* A height-based common container, not a width-based one: this box
          sets ONLY `height` (a clamped percentage of room height) and
          `width:100%` as a horizontal bound, then centers its child via
          flex. It never assumes or checks which renderer CharacterView
          mounts (PixelSpriteRenderer's 1:1 canvas vs ChibiFallbackArt's 5:6
          SVG) — CharacterView's `fit="height"` pushes that responsibility
          down to whichever renderer is actually active, so this component
          can't duplicate/guess renderer-specific sizing logic (both
          renderers apply the exact same object-fit:contain-style contract:
          height:100%, width:auto capped at 100%, own aspect ratio). This is
          what actually keeps the *rendered height* — not just the box's
          width — within MAX_CHARACTER_HEIGHT_RATIO regardless of which
          renderer is active. */}
      <div
        className="absolute flex justify-center"
        style={{
          top: `${CHARACTER_TOP_RATIO * 100}%`,
          left: 0,
          width: '100%',
          // resolveCharacterHeightRatio clamps at MAX_CHARACTER_HEIGHT_RATIO
          // (45%) regardless of `characterScale` — CharacterRoomCard's
          // characterScale=1.3 is tuned for the unrelated legacy SVG room's
          // own 58%×scale formula and must not push the pixel room's
          // character past the 38-45% PRD range.
          height: `${resolveCharacterHeightRatio(characterScale) * 100}%`,
          zIndex: ROOM_CHARACTER_Z_INDEX,
        }}
      >
        <CharacterView
          state={state}
          gender={gender}
          appearance={appearance}
          // Unused in fit="height" mode (height drives sizing instead) —
          // kept for prop-shape consistency, same cap as before.
          size={ROOM_CHARACTER_SIZE_CAP}
          fit="height"
          className="h-full w-auto"
          animated={animated}
        />
      </div>

      {renderGroup('deskFront')}
      {renderGroup('foreground')}
      {renderGroup('lighting')}
    </div>
  )
}
