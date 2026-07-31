import { useMemo, useState } from 'react'
import { SpriteAnimator } from '../engine/SpriteAnimator'
import { ChibiFallbackArt } from '../fallback/ChibiFallbackArt'
import { PixelSpriteRenderer } from '../engine/PixelSpriteRenderer'
import { SPRITE_ASSETS_AVAILABLE } from '../engine/spriteAssetMap'
import { shouldUseSprites } from '../engine/spriteSupport'
import { resolveCatalogEntries } from '../catalog/items'
import { resolveAppearance } from '../presets/defaultPresets'
import { STATE_FRAME_COUNT, STATE_FPS, STATE_HAS_ART } from '../types'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface CharacterViewProps {
  state: CharacterState
  gender?: Gender
  appearance?: Partial<CharacterAppearance>
  size?: number
  /** How the renderer's root box is sized (character/room/PixelRoomRenderer.tsx):
   * 'width' (default) — the literal `size`px drives the box, height follows
   * via each renderer's own aspect ratio. Used by every existing caller
   * (MyPage, AvatarShop, PomodoroTimer, OnboardingFlow, SeatRoom, the
   * legacy SVG room).
   * 'height' — a definite ancestor height drives the box instead (`height:
   * 100%`), width follows via aspect ratio and is capped at 100% of the
   * ancestor's width. Used only by PixelRoomRenderer, which needs the
   * character's rendered HEIGHT to be an exact percentage of room height
   * regardless of which renderer (1:1 PNG or 5:6 SVG) is actually active —
   * CharacterView and its two renderers apply this uniformly, so the room
   * never has to guess or duplicate per-renderer sizing logic. */
  fit?: 'width' | 'height'
  className?: string
  /** Set false to render a static (non-animating) frame — no interval timer
   * is created at all. Use this for avatars that aren't the primary focus
   * (e.g. other users' seats in a crowded room) so a room with many
   * occupants doesn't spin up one independent animation loop per avatar
   * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §13). Defaults to true
   * everywhere else (Home, Pomodoro, profile, shop, capture). */
  animated?: boolean
}

/**
 * Single entry point for rendering the character anywhere in the app
 * (docs/character-system.md). Replaces the legacy `DotAvatar` and the
 * previous `ChibiAvatar`/`AvatarRenderer`.
 */
export function CharacterView({
  state,
  gender = 'boy',
  appearance,
  size = 160,
  fit = 'width',
  className,
  animated = true,
}: CharacterViewProps) {
  // States without dedicated art yet render as idle rather than a broken
  // frame — an explicit, disclosed gap (docs/character-system.md STATE_HAS_ART).
  const effectiveState: CharacterState = STATE_HAS_ART[state] ? state : 'idle'
  const resolvedAppearance = resolveAppearance(gender, appearance)
  const frameCount = STATE_FRAME_COUNT[effectiveState]
  const fps = STATE_FPS[effectiveState]

  // If real sprite files are missing/broken even though the flag says
  // they're available, fall back to the SVG renderer rather than ever
  // showing a broken-image icon (docs/character-system.md §10).
  const [spriteLoadFailed, setSpriteLoadFailed] = useState(false)

  const cosmeticEntries = useMemo(
    () => resolveCatalogEntries(resolvedAppearance.equippedAssetIds),
    [resolvedAppearance.equippedAssetIds],
  )

  // Use the real PNG sprite only when the WHOLE look can be represented:
  // the base image, the requested gender, the requested state, and every
  // equipped cosmetic item all need real support. If any equipped
  // hair/outfit/accessory has no PNG layer yet, fall back to the SVG
  // renderer entirely — it already draws every cosmetic correctly — rather
  // than rendering the new base without that item and making it silently
  // disappear (docs/character-system.md §14).
  const useSprites = shouldUseSprites({
    spriteAssetsAvailable: SPRITE_ASSETS_AVAILABLE,
    spriteLoadFailed,
    gender,
    state: effectiveState,
    cosmeticEntries,
  })

  return (
    <SpriteAnimator
      key={effectiveState}
      frameCount={frameCount}
      fps={fps}
      playing={animated}
      className={className}
      renderFrame={(frame) =>
        useSprites ? (
          <PixelSpriteRenderer
            gender={gender}
            state={effectiveState}
            frame={frame}
            appearance={resolvedAppearance}
            size={size}
            fit={fit}
            onBaseLayerError={() => setSpriteLoadFailed(true)}
          />
        ) : (
          <ChibiFallbackArt
            gender={gender}
            state={effectiveState}
            frame={frame}
            frameCount={frameCount}
            appearance={resolvedAppearance}
            size={size}
            fit={fit}
          />
        )
      }
    />
  )
}
