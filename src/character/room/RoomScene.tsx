import { useCallback, useState } from 'react'
import { LegacySvgRoomRenderer } from './LegacySvgRoomRenderer'
import { PixelRoomRenderer } from './PixelRoomRenderer'
import { FullSceneRoomRenderer } from './FullSceneRoomRenderer'
import { shouldUsePixelRoom } from './roomThemeSupport'
import { shouldUseFullScene } from './fullSceneState'
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
  /** Opts into trying FullSceneRoomRenderer first (see the dispatch order
   * below). Defaults to false. FullSceneRoomRenderer ignores
   * `appearance`/`level`/`animated`, so only callers that don't need those
   * respected should set this — today that's just CharacterRoomCard (Home's
   * timer screen). LogCaptureCard's share card must keep showing equipped
   * cosmetics and its animated=false still frame, so it deliberately never
   * passes this prop. */
  preferFullScene?: boolean
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
 * it dispatches between three renderers:
 *
 *   RoomScene
 *    ├─ FullSceneRoomRenderer (public/sprites/room/default-night/scenes/ — current visual MVP, opt-in only)
 *    ├─ PixelRoomRenderer     (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md — layered PNGs, future customization path)
 *    └─ LegacySvgRoomRenderer (docs/character-system.md §6 — the existing procedural SVG room, final safety net)
 *
 * `FullSceneRoomRenderer` is one baked illustration per gender × state
 * (idle/study/sleep/happy) — it does not read `appearance`/`level`, so
 * equipped cosmetics, background shop items, and level-unlocked furniture
 * (plant/cat) are not visually reflected while it's active. That data is
 * still stored and applied everywhere else in the app; only this renderer's
 * *display* doesn't show it yet. Because of that gap, it's gated behind the
 * `preferFullScene` prop (default false, see `shouldUseFullScene`) rather
 * than always running — only CharacterRoomCard (Home's timer screen) opts
 * in; LogCaptureCard's share card does not, so it keeps rendering through
 * the layered/legacy pair below and still shows equipped cosmetics. If
 * FullSceneRoomRenderer's image 404s, `onError` permanently falls back to
 * that same layered/legacy pair for this mounted instance —
 * `shouldUsePixelRoom` remains false until the delivered room art and the
 * layered avatar are composition-compatible (the legacy study avatar still
 * contains desk pixels), so
 * that fallback lands on LegacySvgRoomRenderer in practice.
 */
export function RoomScene(props: RoomSceneProps) {
  const [pixelRoomLoadFailed, setPixelRoomLoadFailed] = useState(false)
  const [fullSceneLoadFailed, setFullSceneLoadFailed] = useState(false)

  // useCallback (not an inline arrow) so these stay referentially stable
  // across renders — setState setters from useState are themselves stable,
  // so an empty dependency array is correct and these never change identity
  // for the component's lifetime. This matters because StudyTimer re-renders
  // every second while the timer runs: an inline `() => setX(true)` handed
  // to FullSceneRoomRenderer would get a fresh identity on every one of
  // those ticks, and used to be a dependency of its image-swap effect,
  // which could tear down and restart an in-flight image load before a
  // slow fetch ever finished. FullSceneRoomRenderer no longer depends on
  // this identity for that effect either (see its own comment), but keeping
  // both callbacks stable here is the correct fix at the source, and it
  // benefits PixelRoomRenderer's callback the same way even though nothing
  // has reported a matching bug there yet.
  const handleFullSceneError = useCallback(() => setFullSceneLoadFailed(true), [])
  const handlePixelRoomError = useCallback(() => setPixelRoomLoadFailed(true), [])

  const usesFullScene = shouldUseFullScene({
    preferFullScene: props.preferFullScene ?? false,
    fullSceneLoadFailed,
  })

  if (usesFullScene) {
    return (
      <FullSceneRoomRenderer
        state={props.state}
        gender={props.gender ?? 'boy'}
        onError={handleFullSceneError}
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
        onCriticalLayerError={handlePixelRoomError}
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
