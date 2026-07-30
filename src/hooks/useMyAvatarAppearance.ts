import { useShopStore } from '../store/shopStore'
import { resolveAvatarAppearance } from '../utils/avatarAppearance'

/** Resolves the current user's equipped shop items into a renderable avatar appearance. */
export function useMyAvatarAppearance() {
  const items = useShopStore((s) => s.items)
  const equipped = useShopStore((s) => s.equipped)
  return resolveAvatarAppearance(items, equipped)
}
