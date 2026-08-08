import { resolveBaseFramePath } from './spriteManifest'
import type { CharacterAppearance, CharacterState, Gender } from '../types'

/**
 * StudyLog's MVP avatar policy: render one approved, fully composed image.
 * Hair, face, body, clothes, hands and study props are never assembled at
 * runtime. This prevents tiny generation/alignment differences from
 * distorting the character's identity.
 *
 * A future cosmetic is enabled only after a complete state/gender asset set
 * is delivered. Until then the item remains owned/equipped in the store, but
 * the approved default character stays on screen.
 */
export interface WholeAvatarVariant {
  id: string
  /** Exact equipped item ids required by this baked appearance. */
  equippedAssetIds: readonly string[]
  /** Must contain every gender/state/frame before the variant is registered. */
  path: (gender: Gender, state: CharacterState, frame: number) => string
}

/**
 * Intentionally empty for MVP. Add a variant only when its complete image
 * family has been visually approved; never register partial layer artwork.
 */
export const WHOLE_AVATAR_VARIANTS: readonly WholeAvatarVariant[] = []

function appearanceKey(ids: readonly string[] | undefined): string {
  return [...(ids ?? [])].sort().join('|')
}

export function resolveWholeAvatarVariant(appearance: CharacterAppearance): WholeAvatarVariant | undefined {
  const key = appearanceKey(appearance.equippedAssetIds)
  return WHOLE_AVATAR_VARIANTS.find((variant) => appearanceKey(variant.equippedAssetIds) === key)
}

export function resolveWholeAvatarPath(
  gender: Gender,
  state: CharacterState,
  frame: number,
  appearance: CharacterAppearance,
): string {
  const variant = resolveWholeAvatarVariant(appearance)
  return variant?.path(gender, state, frame) ?? resolveBaseFramePath(gender, state, frame)
}
