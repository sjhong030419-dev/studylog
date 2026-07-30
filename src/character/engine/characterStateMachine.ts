import type { CharacterState } from '../types'

interface DeriveCharacterStateInput {
  isRunning: boolean
  isPaused: boolean
  isDistracted: boolean
  /** Continuous-focus fatigue cue, derived from real elapsed session time. */
  isSleepy?: boolean
  /** True briefly right after a real stop-with-logged-session action. */
  justCompleted?: boolean
  /** True briefly right after cumulative study time crosses a level boundary. */
  justLeveledUp?: boolean
}

/** Deterministic priority: levelUp > completed > away > sleepy > study > break(paused) > idle.
 * Never duplicates timer/session state — every input here is derived fresh
 * from the real store each render. */
export function deriveCharacterState({
  isRunning,
  isPaused,
  isDistracted,
  isSleepy = false,
  justCompleted = false,
  justLeveledUp = false,
}: DeriveCharacterStateInput): CharacterState {
  if (justLeveledUp) return 'levelUp'
  if (justCompleted) return 'happy'
  if (isDistracted) return 'away'
  if (isSleepy) return 'sleep'
  if (isRunning && !isPaused) return 'study'
  if (isPaused) return 'break'
  return 'idle'
}
