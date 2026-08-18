import { resolveCosmeticLayerPath } from './spriteManifest'
import type { FullSceneName, FullSceneTheme } from '../room/fullSceneState'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

export const SAKURA_RIBBON_ITEM_ID = 'hair-ribbon'

export function hasSakuraRibbon(appearance: Pick<CharacterAppearance, 'equippedAssetIds'>): boolean {
  return appearance.equippedAssetIds?.includes(SAKURA_RIBBON_ITEM_ID) ?? false
}

export function resolveAvatarRibbonPath(gender: Gender, state: CharacterState): string {
  return resolveCosmeticLayerPath('head-accessory', 'ribbon', gender, state)
}

export function resolveRoomRibbonPath(theme: FullSceneTheme, gender: Gender, scene: FullSceneName): string {
  return `/sprites/room/${theme}/accessories/ribbon/${gender}/${scene}.png`
}

/** Keeps the accessory locked to the scene that is actually visible while
 * FullSceneRoomRenderer waits for a new gender/state image to preload. */
export function resolveRoomRibbonPathFromScenePath(scenePath: string): string {
  return scenePath.replace('/scenes/', '/accessories/ribbon/').replace(/\.webp$/, '.png')
}
