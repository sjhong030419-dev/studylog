import type { Gender } from '../types'

/**
 * Stable render slots for cosmetic parts
 * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §9). Central z-order is
 * defined once here; the renderer never special-cases an item ID.
 */
export type CharacterSlot =
  | 'bodyBase'
  | 'skin'
  | 'hairBack'
  | 'face'
  | 'eyes'
  | 'eyebrows'
  | 'mouth'
  | 'blush'
  | 'bottom'
  | 'shoes'
  | 'top'
  | 'onePiece'
  | 'outerwear'
  | 'hairFront'
  | 'faceAccessory'
  | 'headAccessory'
  | 'backAccessory'
  | 'handheld'
  | 'stateEffect'

export interface CharacterAssetDefinition {
  /** Existing shop item id — stable, never renamed. */
  id: string
  slot: CharacterSlot
  /** Key into the SVG part registry (character/catalog/assetParts.tsx). */
  assetKey: string
  zIndex: number
  /** Undefined means compatible with every base preset — the default,
   * since PRD requires items to be equippable regardless of presentation. */
  compatibleBasePresets?: Gender[]
  incompatibleItemIds?: string[]
  paletteOptions?: string[]
}
