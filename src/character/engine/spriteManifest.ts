import type { CharacterSlot } from '../catalog/types'
import type { CharacterState, Gender } from '../types'

/**
 * Single source of truth for every real sprite file path this app will
 * ever ask for. No component or store should ever hand-write a
 * `/sprites/...` string — they call one of the `resolve*Path` functions
 * below instead. This is what makes the eventual PNG asset drop-in a
 * one-file change (flip `SPRITE_ASSETS_AVAILABLE` in `spriteAssetMap.ts`);
 * every path convention lives here, in one place.
 *
 * See docs/character-system.md §9-§12 for the full asset contract this
 * mirrors, and §13 for the list of files still needed before this can be
 * switched on for real.
 */

/** Square canvas, transparent PNG, per character-only sprite frame. 160 is
 * chosen over the alternative 128 for a chibi silhouette: the oversized
 * head/hair that defines the "치비" proportion needs headroom that 128px
 * starts clipping at typical accessory detail (ribbons, headphones). */
export const SPRITE_CANVAS_SIZE = 160

/**
 * The 10 independently-expandable render layers (back -> front), exactly
 * as specified for this system. Every cosmetic slot in
 * `character/catalog/types.ts` maps to exactly one of these — see
 * `SLOT_TO_LAYER` below.
 */
export type SpriteLayer =
  | 'base'
  | 'skin'
  | 'eyes'
  | 'mouth'
  | 'hairBack'
  | 'outfit'
  | 'hairFront'
  | 'accessory'
  | 'handheld'
  | 'stateEffect'

export const SPRITE_LAYER_ORDER: SpriteLayer[] = [
  'base',
  'skin',
  'eyes',
  'mouth',
  'hairBack',
  'outfit',
  'hairFront',
  'accessory',
  'handheld',
  'stateEffect',
]

/** Which render layer each existing cosmetic slot (character/catalog/types.ts)
 * draws into. The catalog's 19 slots stay exactly as they are — a slot is
 * "what item is equipped", a layer is "what order it paints in" — this is
 * purely the mapping between the two, so nothing about the existing shop
 * catalog needs to change. */
export const SLOT_TO_LAYER: Record<CharacterSlot, SpriteLayer> = {
  bodyBase: 'base',
  skin: 'skin',
  hairBack: 'hairBack',
  face: 'eyes',
  eyes: 'eyes',
  eyebrows: 'eyes',
  mouth: 'mouth',
  blush: 'mouth',
  bottom: 'outfit',
  shoes: 'outfit',
  top: 'outfit',
  onePiece: 'outfit',
  outerwear: 'outfit',
  hairFront: 'hairFront',
  faceAccessory: 'accessory',
  headAccessory: 'accessory',
  backAccessory: 'accessory',
  handheld: 'handheld',
  stateEffect: 'stateEffect',
}

/** The 6 physical folders under `public/sprites/avatar/` (docs
 * character-system.md §12). Several render layers share one folder — e.g.
 * `hairBack` and `hairFront` both live under `hair/`, distinguished by
 * filename, not by folder. */
export type SpriteFolder = 'base' | 'hair' | 'outfit' | 'accessory' | 'face' | 'effects'

export const LAYER_TO_FOLDER: Record<SpriteLayer, SpriteFolder> = {
  base: 'base',
  skin: 'base',
  eyes: 'face',
  mouth: 'face',
  hairBack: 'hair',
  outfit: 'outfit',
  hairFront: 'hair',
  accessory: 'accessory',
  handheld: 'accessory',
  stateEffect: 'effects',
}

const STATE_FILE_NAME: Record<CharacterState, string> = {
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

function pad(frameIndex: number): string {
  return String(frameIndex + 1).padStart(2, '0')
}

/** `base/(gender)_(state)_(frame).png` — the character's body, animated
 * per state (docs §9 file naming, unchanged from the original spec). */
export function resolveBaseFramePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/base/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/** `face/(gender)_(state)_(frame).png` — eyes/mouth/expression, animated
 * per state independently of the body (lets blinking/talking run on its
 * own frame count without needing a full-body redraw per expression). */
export function resolveFaceFramePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/face/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/** `effects/(state)_(frame).png` — state overlays (Zzz, sparkles, sweat
 * drop, …). Gender-neutral: the same effect sprite works over either base. */
export function resolveEffectFramePath(state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/effects/${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/** `(hair|outfit|accessory)/(assetKey)_(frame).png` — one file per cosmetic
 * item's `assetKey` (character/catalog/items.ts), defaulting to a single
 * static frame (`_01`). An item can still declare more frames later (e.g. a
 * swaying ribbon) without changing this function's contract. */
export function resolveCosmeticFramePath(
  folder: Extract<SpriteFolder, 'hair' | 'outfit' | 'accessory'>,
  assetKey: string,
  frameIndex = 0,
): string {
  return `/sprites/avatar/${folder}/${assetKey}_${pad(frameIndex)}.png`
}
