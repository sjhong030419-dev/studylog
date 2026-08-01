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
