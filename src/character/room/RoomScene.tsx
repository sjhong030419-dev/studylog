import { useState } from 'react'
import { LegacySvgRoomRenderer } from './LegacySvgRoomRenderer'
import { PixelRoomRenderer } from './PixelRoomRenderer'
import { shouldUsePixelRoom } from './roomThemeSupport'
import type { RoomThemeId } from './roomAssetManifest'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

interface RoomSceneProps {
  state: CharacterState
  gender?: Gender
  appearance?: Partial<CharacterAppearance>
  level: number
  /** Passed straight through to the character — see CharacterView's
   * multi-seat animation-throttling contract. */
  animated?: boolean
  /** Multiplies the character's default width. Defaults to 1 (unchanged)
   * for every existing caller (LogCaptureCard's share card, etc.) — only
   * the Home screen's main character card opts into a larger value
   * (CharacterRoomCard) so the character reads clearly as the screen's
   * focal point without resizing the character anywhere else. */
  characterScale?: number
}

/** The only approved pixel room concept today (docs/assets/study-room-approved-v1.png,
 * commit 06adca8) — see docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md. A
 * second theme means a second approved reference image and a second key
 * here, never a guess. */
const ACTIVE_THEME_ID: RoomThemeId = 'default-night'

/**
 * Public entry point for the study room scene — every screen that shows the
 * room (Home's CharacterRoomCard, the result share card via LogCaptureCard)
 * keeps calling this exact component with this exact prop shape. Internally
 * it now dispatches between two renderers:
 *
 *   RoomScene
 *    ├─ PixelRoomRenderer     (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md — real PNG layers)
 *    └─ LegacySvgRoomRenderer (docs/character-system.md §6 — the existing procedural SVG room)
 *
 * `shouldUsePixelRoom` is false for every theme today (no real layer PNGs
 * exist yet — roomThemeSupport.ts CONFIRMED_ROOM_LAYER_IDS is empty), so
 * this always renders LegacySvgRoomRenderer right now: the pixel room only
 * activates once a theme's required layers are both declared AND real.
 */
export function RoomScene(props: RoomSceneProps) {
  const [pixelRoomLoadFailed, setPixelRoomLoadFailed] = useState(false)

  const usePixelRoom = shouldUsePixelRoom({ themeId: ACTIVE_THEME_ID, pixelRoomLoadFailed })

  if (usePixelRoom) {
    return (
      <PixelRoomRenderer
        themeId={ACTIVE_THEME_ID}
        state={props.state}
        gender={props.gender}
        appearance={props.appearance}
        level={props.level}
        animated={props.animated}
        characterScale={props.characterScale}
        onCriticalLayerError={() => setPixelRoomLoadFailed(true)}
      />
    )
  }

  return (
    <LegacySvgRoomRenderer
      state={props.state}
      gender={props.gender}
      appearance={props.appearance}
      level={props.level}
      animated={props.animated}
      characterScale={props.characterScale}
    />
  )
}
