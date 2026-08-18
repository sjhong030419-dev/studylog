import type { CharacterState } from '../types'

export type FullSceneName = 'idle' | 'study' | 'sleep' | 'happy'
export type FullSceneTheme = 'default-night' | 'sakura-uniform'

/** Maps a complete whole-avatar variant to a baked room skin. `undefined`
 * means the appearance still needs the live avatar renderer because no
 * matching full-scene family has been delivered yet. */
export function resolveFullSceneTheme(variantId?: string): FullSceneTheme | undefined {
  if (!variantId) return 'default-night'
  if (variantId === 'skin-sakura-uniform-girl') return 'sakura-uniform'
  return undefined
}

export function resolveFullScenePath(theme: FullSceneTheme, gender: 'girl' | 'boy', scene: FullSceneName): string {
  return `/sprites/room/${theme}/scenes/${gender}/${scene}.webp`
}

const SCENE_BY_STATE: Record<CharacterState, FullSceneName> = {
  idle: 'idle',
  study: 'study',
  thinking: 'idle',
  reading: 'study',
  typing: 'study',
  break: 'idle',
  sleep: 'sleep',
  happy: 'happy',
  excited: 'happy',
  celebrate: 'happy',
  levelUp: 'happy',
  focused: 'study',
  away: 'idle',
}

export function resolveFullSceneName(state: CharacterState): FullSceneName {
  return SCENE_BY_STATE[state]
}

export interface ShouldUseFullSceneInput {
  /** RoomScene only tries the baked full-scene renderer when a caller
   * explicitly opts in. FullSceneRoomRenderer only reads `state`/`gender` —
   * it ignores `appearance`/`level`/`animated` — so a caller that still
   * needs those respected (e.g. LogCaptureCard's share card, which shows
   * equipped cosmetics and the animated=false still frame) must NOT opt in
   * and keeps getting the layered/legacy pair instead. */
  preferFullScene: boolean
  /** True once the current scene image failed to load this session —
   * permanent for the mounted instance, same defense-in-depth pattern as
   * roomThemeSupport.ts's `pixelRoomLoadFailed`. */
  fullSceneLoadFailed: boolean
  /** True when the user's equipped appearance resolves to a complete
   * whole-avatar variant. Baked full-scene artwork cannot reflect that
   * appearance, so RoomScene must use the live character renderer instead. */
  hasRenderableAppearanceVariant: boolean
}

/** The single decision RoomScene uses to pick FullSceneRoomRenderer over
 * the layered/legacy pair — mirrors roomThemeSupport.ts's
 * `shouldUsePixelRoom`. Pure function so every branch (opted in vs not,
 * failed vs not) is independently testable without rendering React. */
export function shouldUseFullScene({
  preferFullScene,
  fullSceneLoadFailed,
  hasRenderableAppearanceVariant,
}: ShouldUseFullSceneInput): boolean {
  return preferFullScene && !fullSceneLoadFailed && !hasRenderableAppearanceVariant
}

export type FullSceneSwapDecision =
  | { kind: 'unchanged' }
  | { kind: 'swap-immediately' }
  | { kind: 'load-then-swap' }

/**
 * The decision FullSceneRoomRenderer's image-swap effect makes on every
 * run — pulled out as a pure function so "an unrelated parent re-render
 * must never restart an in-flight image load" (the exact bug this fixes:
 * StudyTimer re-renders every second, and an unstable `onError` reference
 * used to be a dependency of that effect) has a regression guard that
 * doesn't require a DOM-rendering test harness. `currentTarget` and
 * `nextTarget` come from `scenePath(gender, scene)` — when they're equal,
 * the caller changed for a reason OTHER than gender/state (e.g. `onError`
 * identity, or the effect's own prior `setDisplaySrc` call) and nothing
 * should happen. */
export function resolveFullSceneSwap(currentTarget: string, nextTarget: string, isPreloaded: boolean): FullSceneSwapDecision {
  if (nextTarget === currentTarget) return { kind: 'unchanged' }
  if (isPreloaded) return { kind: 'swap-immediately' }
  return { kind: 'load-then-swap' }
}
