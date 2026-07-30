/**
 * Unified character type system (docs/character-system.md). Replaces the
 * legacy `AvatarStatus` (4-state, still used by the study-room presence
 * system until it's migrated) and the previous `ChibiPose` (7-state,
 * Home-only) with one vocabulary usable across the whole app.
 */

export type Gender = 'boy' | 'girl'

/** The 12 states from docs/character-system.md §5, plus `away` — an
 * app-specific extension needed to preserve the existing away/app-exit
 * detection feature, which the art spec doesn't address. */
export type CharacterState =
  | 'idle'
  | 'study'
  | 'thinking'
  | 'reading'
  | 'typing'
  | 'break'
  | 'sleep'
  | 'happy'
  | 'excited'
  | 'celebrate'
  | 'levelUp'
  | 'focused'
  | 'away'

/** Per-state animation frame counts (docs/character-system.md §5). States
 * without a real trigger yet (thinking/reading/typing/excited/focused) still
 * get a frame count so the engine/asset contract is ready for them. */
export const STATE_FRAME_COUNT: Record<CharacterState, number> = {
  idle: 8,
  study: 10,
  thinking: 6,
  reading: 6,
  typing: 8,
  break: 4,
  sleep: 8,
  happy: 10,
  excited: 8,
  celebrate: 12,
  levelUp: 12,
  focused: 8,
  away: 4,
}

export const STATE_FPS: Record<CharacterState, number> = {
  idle: 6,
  study: 8,
  thinking: 6,
  reading: 6,
  typing: 10,
  break: 6,
  sleep: 4,
  happy: 10,
  excited: 10,
  celebrate: 12,
  levelUp: 12,
  focused: 8,
  away: 6,
}

/** True for states with a distinct, implemented pose/expression in the SVG
 * fallback layer (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §10). All
 * 12 declared states now have distinct lightweight fallback art — none of
 * them silently render as `idle` anymore. */
export const STATE_HAS_ART: Record<CharacterState, boolean> = {
  idle: true,
  study: true,
  thinking: true,
  reading: true,
  typing: true,
  break: true,
  sleep: true,
  happy: true,
  excited: true,
  celebrate: true,
  levelUp: true,
  focused: true,
  away: true,
}

export interface CharacterAppearance {
  gender: Gender
  skinTone: string
  hairColor: string
  outfitColor: string
  pantsColor: string
  shoeColor: string
  outlineColor: string
  /** Equipped room-background item's color, applied to RoomScene's wall.
   * Undefined means "no background equipped" — keep the default room. */
  backgroundColor?: string
  /** Shop item ids (hair/outfit/accessory categories) currently equipped,
   * resolved through the cosmetic catalog at render time
   * (character/catalog/). Replaces the old hairEmoji/accessoryEmoji
   * passthrough entirely. */
  equippedAssetIds?: string[]
}

export interface GrowthStage {
  level: number
  label: string
  /** Stable ids consumed by RoomScene to decide which furniture to render. */
  additions: string[]
}
