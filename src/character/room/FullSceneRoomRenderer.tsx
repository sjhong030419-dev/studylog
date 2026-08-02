import { useEffect, useRef, useState } from 'react'
import type { CharacterState, Gender } from '../types'
import { resolveFullSceneName, type FullSceneName } from './fullSceneState'

interface FullSceneRoomRendererProps {
  state: CharacterState
  gender: Gender
  /** Fires once if the resolved scene image fails to load — RoomScene
   * treats this as permanent for the mounted instance and falls back to
   * the layered/legacy renderers (see RoomScene.tsx's top-of-file doc
   * comment). */
  onError: () => void
}

/** Single source of truth for the baked-scene file path — mirrors
 * roomAssetManifest.ts's `assetPath()` convention for the layered renderer
 * so no caller ever hand-writes a `/sprites/room/...` string. WebP, not
 * PNG: the source art (preserved at full resolution in
 * docs/assets/room-v2/) is ~1.3MB per PNG; re-encoded as WebP at quality 85
 * these are ~100KB each with no visible quality loss, roughly a 13x
 * reduction across the 4 states × 2 genders. */
function scenePath(gender: Gender, scene: FullSceneName): string {
  return `/sprites/room/default-night/scenes/${gender}/${scene}.webp`
}

const ALL_SCENES: FullSceneName[] = ['idle', 'study', 'sleep', 'happy']

/** requestIdleCallback isn't available in Safari — falls back to a plain
 * setTimeout so the deferred preload below still runs everywhere. Returns
 * a single cancel function so the caller doesn't need to know which path
 * was taken. */
function scheduleIdlePreload(run: () => void, timeoutMs: number): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(run, { timeout: timeoutMs })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(run, timeoutMs)
  return () => window.clearTimeout(handle)
}

const IDLE_PRELOAD_TIMEOUT_MS = 2000

/**
 * Renders one fully-baked 640×800 illustration (character + room, one
 * cohesive piece of art) per gender × state — the current visual MVP for
 * the study room (see RoomScene.tsx). Purely presentational: it only reads
 * `state`/`gender`, never `appearance`/`level`, so it cannot show equipped
 * cosmetics or level-unlocked furniture (that data still exists and is used
 * elsewhere — this renderer just doesn't visualize it yet).
 */
export function FullSceneRoomRenderer({ state, gender, onError }: FullSceneRoomRendererProps) {
  const scene = resolveFullSceneName(state)
  const [displaySrc, setDisplaySrc] = useState(() => scenePath(gender, scene))
  const loadedRef = useRef<Set<string>>(new Set())

  // The image currently on screen loads immediately via the <img> below.
  // Every OTHER state for this gender is deferred until the browser is
  // idle (or IDLE_PRELOAD_TIMEOUT_MS elapses) rather than fetched
  // up front — firing all 4 at once on mount competes for bandwidth with
  // the one actually visible.
  useEffect(() => {
    const preloaded: HTMLImageElement[] = []
    const cancelIdle = scheduleIdlePreload(() => {
      for (const name of ALL_SCENES) {
        const path = scenePath(gender, name)
        if (loadedRef.current.has(path)) continue
        const image = new Image()
        image.onload = () => loadedRef.current.add(path)
        image.src = path
        preloaded.push(image)
      }
    }, IDLE_PRELOAD_TIMEOUT_MS)

    return () => {
      cancelIdle()
      // Clears the src of any preload still in flight so the browser
      // aborts that fetch instead of finishing a download nothing needs
      // anymore after unmount.
      for (const image of preloaded) {
        image.onload = null
        image.src = ''
      }
    }
  }, [gender])

  // Swaps the visible image only once the target has fully finished
  // loading in the background — a state/gender change never shows a blank
  // or half-loaded frame; the previous image stays on screen until the new
  // one is confirmed ready.
  useEffect(() => {
    const target = scenePath(gender, scene)
    if (target === displaySrc) return
    if (loadedRef.current.has(target)) {
      setDisplaySrc(target)
      return
    }
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      loadedRef.current.add(target)
      setDisplaySrc(target)
    }
    image.onerror = () => {
      if (!cancelled) onError()
    }
    image.src = target
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [gender, scene, displaySrc, onError])

  return (
    <img
      src={displaySrc}
      alt=""
      aria-hidden="true"
      className="block w-full h-full object-cover object-center"
      draggable={false}
      onLoad={() => loadedRef.current.add(displaySrc)}
      onError={onError}
    />
  )
}
