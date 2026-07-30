import { useState } from 'react'
import { SpriteAnimator } from '../engine/SpriteAnimator'
import { ChibiFallbackArt } from '../fallback/ChibiFallbackArt'
import { PixelSpriteRenderer } from '../engine/PixelSpriteRenderer'
import { SPRITE_ASSETS_AVAILABLE } from '../engine/spriteAssetMap'
import { resolveAppearance } from '../presets/defaultPresets'
import { STATE_FRAME_COUNT, STATE_FPS, STATE_HAS_ART } from '../types'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface CharacterViewProps {
  state: CharacterState
  gender?: Gender
  appearance?: Partial<CharacterAppearance>
  size?: number
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
  const useSprites = SPRITE_ASSETS_AVAILABLE && !spriteLoadFailed

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
          />
        )
      }
    />
  )
}
