import { useState } from 'react'
import { LegacySvgRoomRenderer } from './LegacySvgRoomRenderer'
import { PixelRoomRenderer } from './PixelRoomRenderer'
import { FullSceneRoomRenderer } from './FullSceneRoomRenderer'
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
 * it now dispatches between three renderers, in this priority order:
 *
 *   RoomScene
 *    ├─ FullSceneRoomRenderer (public/sprites/room/default-night/scenes/ — current visual MVP)
 *    ├─ PixelRoomRenderer     (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md — layered PNGs, future customization path)
 *    └─ LegacySvgRoomRenderer (docs/character-system.md §6 — the existing procedural SVG room, final safety net)
 *
 * `FullSceneRoomRenderer` is one baked illustration per gender × state
 * (idle/study/sleep/happy) — it does not read `appearance`/`level`, so
 * equipped cosmetics, background shop items, and level-unlocked furniture
 * (plant/cat) are not visually reflected while it's active. That data is
 * still stored and applied everywhere else in the app; only this renderer's
 * *display* doesn't show it yet. If its image 404s, `onError` permanently
 * falls back to the layered/legacy pair below for this mounted instance —
 * `shouldUsePixelRoom` is false for every theme today (no real layer PNGs
 * exist yet — roomThemeSupport.ts CONFIRMED_ROOM_LAYER_IDS is empty), so
 * that fallback lands on LegacySvgRoomRenderer in practice.
 */
export function RoomScene(props: RoomSceneProps) {
  const [pixelRoomLoadFailed, setPixelRoomLoadFailed] = useState(false)
  const [fullSceneLoadFailed, setFullSceneLoadFailed] = useState(false)

  if (!fullSceneLoadFailed) {
    return (
      <FullSceneRoomRenderer
        state={props.state}
        gender={props.gender ?? 'boy'}
        onError={() => setFullSceneLoadFailed(true)}
      />
    )
  }

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
