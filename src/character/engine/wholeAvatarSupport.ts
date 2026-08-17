import { pad, resolveBaseFramePath, STATE_FILE_NAME } from './spriteManifest'
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
  /** Higher values win when more than one complete appearance is equipped. */
  priority?: number
  /** Exact equipped item ids required by this baked appearance. Matching is
   * subset-based (see `resolveWholeAvatarVariant`), not exact-set equality —
   * a variant matches whenever every one of its required ids is equipped,
   * regardless of what else is also equipped. */
  equippedAssetIds: readonly string[]
  /** Genders this variant's image family actually covers. A variant that
   * matches by equipped ids but doesn't support the current gender is
   * treated as not matching at all — `resolveWholeAvatarPath` falls back to
   * the default baked base for that gender instead. */
  supportedGenders: readonly Gender[]
  /** Must contain every gender/state/frame before the variant is registered. */
  path: (gender: Gender, state: CharacterState, frame: number) => string
}

/** `/sprites/avatar/whole/black-hair/{gender}_{state}_{frame}.png` — the
 * delivered 104-file girl family (docs/Claude_Black_Hair_Whole_Avatar_Implementation_Prompt.md).
 * Reuses `STATE_FILE_NAME`/`pad` from spriteManifest.ts (the same
 * convention `resolveBaseFramePath` uses) rather than a second state-name
 * table that could drift out of sync. */
function resolveBlackHairWholePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/whole/black-hair/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

function resolveSakuraUniformWholePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/whole/sakura-uniform/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/**
 * Registered whole-avatar variants. Add a variant only when its complete
 * image family (every required gender × all 13 states × the state's full
 * frame count) has been visually approved; never register partial layer
 * artwork.
 *
 * Every registered gender must have a complete 104-frame family. Black hair
 * remains girl-only; sakura uniform has complete girl and boy families.
 */
export const WHOLE_AVATAR_VARIANTS: readonly WholeAvatarVariant[] = [
  {
    id: 'hair-color-black',
    priority: 100,
    equippedAssetIds: ['hair-color-black'],
    supportedGenders: ['girl'],
    path: resolveBlackHairWholePath,
  },
  {
    id: 'skin-sakura-uniform-girl',
    priority: 1000,
    equippedAssetIds: ['skin-sakura-uniform-girl'],
    supportedGenders: ['girl', 'boy'],
    path: resolveSakuraUniformWholePath,
  },
]

function matchesEquipped(variant: WholeAvatarVariant, equippedIds: readonly string[]): boolean {
  return variant.equippedAssetIds.every((id) => equippedIds.includes(id))
}

/**
 * Most-specific-subset matching: a variant matches when every one of its
 * required ids is equipped (not exact-set equality) AND it supports the
 * given gender. When multiple variants match, the one requiring the most
 * ids wins — so a future complete `hair-color-black` + `hair-ribbon`
 * variant would win over the single-item `hair-color-black` variant once
 * both items are equipped, while today, with only the single-item variant
 * registered, an unsupported extra item (like a ribbon with no baked
 * black-hair+ribbon art yet) is simply ignored rather than reverting the
 * whole character to the default brown-hair look.
 */
export function resolveWholeAvatarVariant(
  appearance: CharacterAppearance,
  gender: Gender,
  // Defaults to the real registry. Overridable so tests can prove the
  // most-specific-wins rule against a synthetic multi-variant registry —
  // WHOLE_AVATAR_VARIANTS only has one real entry today, which can't by
  // itself exercise the "two candidates, pick the bigger one" branch.
  variants: readonly WholeAvatarVariant[] = WHOLE_AVATAR_VARIANTS,
): WholeAvatarVariant | undefined {
  const equippedIds = appearance.equippedAssetIds ?? []
  const candidates = variants.filter(
    (variant) => matchesEquipped(variant, equippedIds) && variant.supportedGenders.includes(gender),
  )
  if (candidates.length === 0) return undefined
  return candidates.reduce((best, variant) => {
    if ((variant.priority ?? 0) !== (best.priority ?? 0)) {
      return (variant.priority ?? 0) > (best.priority ?? 0) ? variant : best
    }
    return variant.equippedAssetIds.length > best.equippedAssetIds.length ? variant : best
  })
}

/** Ordered, de-duplicated runtime load chain: explicit skin/most-specific
 * variant, any supported underlying variant, then the approved base PNG. */
export function resolveWholeAvatarSourceChain(
  gender: Gender,
  state: CharacterState,
  frame: number,
  appearance: CharacterAppearance,
): string[] {
  const equippedIds = appearance.equippedAssetIds ?? []
  const variantPaths = WHOLE_AVATAR_VARIANTS
    .filter((variant) => matchesEquipped(variant, equippedIds) && variant.supportedGenders.includes(gender))
    .slice()
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.equippedAssetIds.length - a.equippedAssetIds.length)
    .map((variant) => variant.path(gender, state, frame))
  return [...new Set([...variantPaths, resolveBaseFramePath(gender, state, frame)])]
}

export function resolveWholeAvatarPath(
  gender: Gender,
  state: CharacterState,
  frame: number,
  appearance: CharacterAppearance,
): string {
  return resolveWholeAvatarPathWithFallback(gender, state, frame, appearance).primary
}

/**
 * `primary`: the same path `resolveWholeAvatarPath` returns — a matched
 * variant's baked image, or (no match) the approved default base image.
 * `fallback`: always the approved default base image for this exact
 * gender/state/frame, independent of whichever variant did or didn't match.
 *
 * When no variant matches, `primary === fallback` — there is nothing left to
 * retry if that single image fails, which is exactly the pre-existing
 * default-appearance behavior (WholeAvatarRenderer.tsx escalates straight to
 * its caller's SVG fallback in that case, same as before this function
 * existed). When a variant does match, a `primary` load failure (a single
 * broken/missing cosmetic-variant frame) is not itself a reason to abandon
 * PNG rendering for the whole character — retrying `fallback` first is what
 * lets one bad black-hair frame fall back to the ordinary default character
 * instead of the much more jarring SVG chibi swap.
 */
export interface WholeAvatarPathResolution {
  primary: string
  fallback: string
}

export function resolveWholeAvatarPathWithFallback(
  gender: Gender,
  state: CharacterState,
  frame: number,
  appearance: CharacterAppearance,
): WholeAvatarPathResolution {
  const variant = resolveWholeAvatarVariant(appearance, gender)
  const fallback = resolveBaseFramePath(gender, state, frame)
  return { primary: variant?.path(gender, state, frame) ?? fallback, fallback }
}

/**
 * `src`: what WholeAvatarRenderer should actually request right now.
 * `isFinalAttempt`: true when `src` is the last thing left to try — a load
 * failure of THIS src must escalate to the caller's non-PNG (SVG) fallback,
 * not retry anything else, so a truly broken pair of files can't spin in a
 * retry loop.
 *
 * `failedPrimarySrc` is deliberately just "the last `primary` src that
 * failed", not a permanent per-component flag — comparing it against the
 * CURRENT resolution's `primary` (which changes every state/frame change) is
 * what lets a state or frame change immediately retry the real variant image
 * again instead of getting stuck on the fallback forever. A `primary` that
 * has already failed once stays on `fallback` if the animation loops back to
 * that exact same frame, rather than re-requesting a known-broken URL.
 */
export interface WholeAvatarLoadState {
  src: string
  isFinalAttempt: boolean
}

export function resolveWholeAvatarLoadState(
  resolution: WholeAvatarPathResolution,
  failedPrimarySrc: string | null,
): WholeAvatarLoadState {
  const { primary, fallback } = resolution
  if (failedPrimarySrc !== primary) {
    return { src: primary, isFinalAttempt: primary === fallback }
  }
  return { src: fallback, isFinalAttempt: true }
}

/**
 * Whether equipping `itemId` would actually change what's on screen for
 * `gender` — used by the shop UI (AvatarShop.tsx) to warn before a boy
 * user spends points on `hair-color-black`, which has no boy art yet and
 * would render as the plain default character. Independent of what else is
 * equipped (checks the item in isolation, not a full appearance), since the
 * shop needs to answer this before anything is purchased or equipped.
 */
export function isWholeAvatarItemSupportedForGender(itemId: string, gender: Gender): boolean {
  return WHOLE_AVATAR_VARIANTS.some(
    (variant) => variant.equippedAssetIds.includes(itemId) && variant.supportedGenders.includes(gender),
  )
}
