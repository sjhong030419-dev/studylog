import { SpriteAnimator } from '../engine/SpriteAnimator'
import { ChibiFallbackArt } from '../fallback/ChibiFallbackArt'
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

  return (
    <SpriteAnimator
      key={effectiveState}
      frameCount={frameCount}
      fps={fps}
      playing={animated}
      className={className}
      renderFrame={(frame) => (
        <ChibiFallbackArt
          gender={gender}
          state={effectiveState}
          frame={frame}
          frameCount={frameCount}
          appearance={resolvedAppearance}
          size={size}
        />
      )}
    />
  )
}
