import { useEffect, useRef, useState } from 'react'
import type { CharacterState, Gender } from '../types'
import {
  resolveFullSceneName,
  resolveFullScenePath,
  resolveFullSceneSwap,
  type FullSceneName,
  type FullSceneTheme,
} from './fullSceneState'

interface FullSceneRoomRendererProps {
  state: CharacterState
  gender: Gender
  theme: FullSceneTheme
  /** Fires once if the resolved scene image fails to load — RoomScene
   * treats this as permanent for the mounted instance and falls back to
   * the layered/legacy renderers (see RoomScene.tsx's top-of-file doc
   * comment). RoomScene passes a `useCallback`-stabilized reference, but
   * this component doesn't rely on that: the swap effect below reads
   * `onError` through a ref (see `onErrorRef`) specifically so an
   * unstable caller-supplied identity can never restart an in-flight load. */
  onError: () => void
}

/** Single source of truth for the baked-scene file path — mirrors
 * roomAssetManifest.ts's `assetPath()` convention for the layered renderer
 * so no caller ever hand-writes a `/sprites/room/...` string. WebP, not
 * PNG: the source art (preserved at full resolution in
 * docs/assets/room-v2/) is ~1.3MB per PNG; re-encoded as WebP at quality 85
 * these are ~100KB each with no visible quality loss, roughly a 13x
 * reduction across the 4 states × 2 genders. */
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
export function FullSceneRoomRenderer({ state, gender, theme, onError }: FullSceneRoomRendererProps) {
  const scene = resolveFullSceneName(state)
  const [displaySrc, setDisplaySrc] = useState(() => resolveFullScenePath(theme, gender, scene))
  // Mirrors `displaySrc` synchronously (state updates are async/batched) so
  // the swap effect below can read "what's on screen right now" without
  // needing `displaySrc` in its own dependency array — see that effect's
  // comment for why that matters.
  const displaySrcRef = useRef(displaySrc)
  const loadedRef = useRef<Set<string>>(new Set())
  // StudyTimer re-renders every second while the timer runs, and every
  // ancestor render used to hand RoomScene's inline `() => setX(true)` a
  // fresh function identity. Reading `onError` through a ref — updated by
  // its own tiny effect, never by the swap effect — means the swap effect
  // itself never needs `onError` in its dependency array, so it can't be
  // torn down and restarted by an ancestor re-render alone.
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  function setDisplayed(target: string) {
    displaySrcRef.current = target
    setDisplaySrc(target)
  }

  // The image currently on screen loads immediately via the <img> below.
  // Every OTHER state for this gender is deferred until the browser is
  // idle (or IDLE_PRELOAD_TIMEOUT_MS elapses) rather than fetched
  // up front — firing all 4 at once on mount competes for bandwidth with
  // the one actually visible.
  useEffect(() => {
    const preloaded: HTMLImageElement[] = []
    const cancelIdle = scheduleIdlePreload(() => {
      for (const name of ALL_SCENES) {
        const path = resolveFullScenePath(theme, gender, name)
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
  }, [gender, theme])

  // Swaps the visible image only once the target has fully finished
  // loading in the background — a state/gender change never shows a blank
  // or half-loaded frame; the previous image stays on screen until the new
  // one is confirmed ready.
  //
  // Dependency array is deliberately just [gender, scene] — the only two
  // things a target image should ever restart for (`resolveFullSceneSwap`
  // is the pure decision this mirrors, unit-tested in
  // FullSceneRoomRenderer.test.ts). `onError` is read via `onErrorRef`
  // above instead of listed here, and `displaySrc` is read via
  // `displaySrcRef` instead of the state value itself, specifically so an
  // ancestor's unrelated re-render (StudyTimer ticking every second) can
  // never tear down and restart an in-flight fetch mid-load.
  useEffect(() => {
    const target = resolveFullScenePath(theme, gender, scene)
    const decision = resolveFullSceneSwap(displaySrcRef.current, target, loadedRef.current.has(target))

    if (decision.kind === 'unchanged') return
    if (decision.kind === 'swap-immediately') {
      setDisplayed(target)
      return
    }

    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      loadedRef.current.add(target)
      setDisplayed(target)
    }
    image.onerror = () => {
      if (!cancelled) onErrorRef.current()
    }
    image.src = target
    return () => {
      cancelled = true
      image.onload = null
      image.onerror = null
    }
  }, [gender, scene, theme])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#251f35]">
      <img
        src={displaySrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-35 blur-xl"
        draggable={false}
        decoding="async"
      />
      <img
        src={displaySrc}
        alt=""
        aria-hidden="true"
        className="relative block h-full w-full object-contain object-center"
        draggable={false}
        decoding="async"
        onLoad={() => loadedRef.current.add(displaySrc)}
        onError={onError}
      />
    </div>
  )
}
