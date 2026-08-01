import { useEffect, useMemo } from 'react'
import type { CharacterState, Gender } from '../types'
import { resolveFullSceneName, type FullSceneName } from './fullSceneState'

interface FullSceneRoomRendererProps {
  state: CharacterState
  gender: Gender
  /** Fires once if the resolved scene image 404s — RoomScene treats this as
   * permanent for the mounted instance and falls back to the layered/legacy
   * renderers (see RoomScene.tsx's top-of-file doc comment). */
  onError: () => void
}

/** Single source of truth for the baked-scene file path — mirrors
 * roomAssetManifest.ts's `assetPath()` convention for the layered renderer
 * so no caller ever hand-writes a `/sprites/room/...` string. */
function scenePath(gender: Gender, scene: FullSceneName): string {
  return `/sprites/room/default-night/scenes/${gender}/${scene}.png`
}

const ALL_SCENES: FullSceneName[] = ['idle', 'study', 'sleep', 'happy']

/**
 * Renders one fully-baked 640×800 illustration (character + room, one
 * cohesive piece of art) per gender × state — the current visual MVP for
 * the study room (see RoomScene.tsx). Purely presentational: it only reads
 * `state`/`gender`, never `appearance`/`level`, so it cannot show equipped
 * cosmetics or level-unlocked furniture (that data still exists and is used
 * elsewhere — this renderer just doesn't visualize it yet).
 */
export function FullSceneRoomRenderer({ state, gender, onError }: FullSceneRoomRendererProps) {
  const scene = useMemo(() => resolveFullSceneName(state), [state])

  // Warms the browser cache for every state of the current gender up front,
  // so switching state later (e.g. idle -> study) swaps to an already-cached
  // image instead of a fresh network fetch — avoids a blank flash mid-timer.
  useEffect(() => {
    for (const name of ALL_SCENES) {
      const image = new Image()
      image.src = scenePath(gender, name)
    }
  }, [gender])

  return (
    <img
      src={scenePath(gender, scene)}
      alt=""
      aria-hidden="true"
      className="block w-full h-full object-cover object-center"
      draggable={false}
      onError={onError}
    />
  )
}
