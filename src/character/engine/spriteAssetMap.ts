import type { CharacterState, Gender } from '../types'

/**
 * PNG sprite asset pipeline is not built yet — no image files exist in the
 * project (docs/character-system.md §9 is a target spec, not current
 * reality). This flag is the single switch: flip it to `true` once real
 * `(gender)_(action)_(frame).png` files are added under `public/sprites/`,
 * and wire `resolveSpriteFramePath` into CharacterView's renderer in place
 * of the SVG fallback. No other engine file needs to change.
 */
export const SPRITE_ASSETS_AVAILABLE = false

const ACTION_NAME: Record<CharacterState, string> = {
  idle: 'idle',
  study: 'study',
  thinking: 'thinking',
  reading: 'reading',
  typing: 'typing',
  break: 'break',
  sleep: 'sleep',
  happy: 'happy',
  excited: 'excited',
  celebrate: 'celebrate',
  levelUp: 'levelup',
  focused: 'focused',
  away: 'away',
}

/** `(gender)_(action)_(frame).png`, e.g. `boy_study_01.png` (docs/character-system.md §9). */
export function resolveSpriteFramePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  const frameNumber = String(frameIndex + 1).padStart(2, '0')
  return `/sprites/${gender}_${ACTION_NAME[state]}_${frameNumber}.png`
}
