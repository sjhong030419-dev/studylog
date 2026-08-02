import type { CharacterState } from '../types'

export type FullSceneName = 'idle' | 'study' | 'sleep' | 'happy'

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
}

/** The single decision RoomScene uses to pick FullSceneRoomRenderer over
 * the layered/legacy pair — mirrors roomThemeSupport.ts's
 * `shouldUsePixelRoom`. Pure function so every branch (opted in vs not,
 * failed vs not) is independently testable without rendering React. */
export function shouldUseFullScene({ preferFullScene, fullSceneLoadFailed }: ShouldUseFullSceneInput): boolean {
  return preferFullScene && !fullSceneLoadFailed
}
