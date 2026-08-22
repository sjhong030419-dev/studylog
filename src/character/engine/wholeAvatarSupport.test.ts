import { describe, expect, it } from 'vitest'
import { DEFAULT_PRESETS } from '../presets/defaultPresets'
import {
  isWholeAvatarItemSupportedForGender,
  resolveWholeAvatarLoadState,
  resolveWholeAvatarPath,
  resolveWholeAvatarPathWithFallback,
  resolveWholeAvatarSourceChain,
  resolveWholeAvatarVariant,
  WHOLE_AVATAR_VARIANTS,
} from './wholeAvatarSupport'
import type { CharacterState } from '../types'

const ALL_STATES: CharacterState[] = [
  'idle',
  'study',
  'thinking',
  'reading',
  'typing',
  'break',
  'sleep',
  'happy',
  'excited',
  'celebrate',
  'levelUp',
  'focused',
  'away',
]

describe('whole-avatar MVP rendering policy', () => {
  it('uses the approved complete base image for the default appearance', () => {
    expect(resolveWholeAvatarPath('girl', 'study', 0, DEFAULT_PRESETS.girl)).toBe(
      '/sprites/avatar/base/girl_study_01.png',
    )
  })

  it('keeps the complete default image when an item has no approved baked variant', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['outfit-hoodie', 'acc-ribbon'] }
    expect(resolveWholeAvatarVariant(appearance, 'girl')).toBeUndefined()
    expect(resolveWholeAvatarPath('girl', 'study', 4, appearance)).toBe('/sprites/avatar/base/girl_study_05.png')
  })
})

describe('moonlight academy complete seasonal skin', () => {
  const girlAppearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['skin-moonlight-academy'] }
  const boyAppearance = { ...DEFAULT_PRESETS.boy, equippedAssetIds: ['skin-moonlight-academy'] }

  it('is registered for both genders', () => {
    const variant = WHOLE_AVATAR_VARIANTS.find((candidate) => candidate.id === 'skin-moonlight-academy')
    expect(variant?.supportedGenders).toEqual(['girl', 'boy'])
  })

  it.each(ALL_STATES)('resolves every girl state through the moonlight academy family: %s', (state) => {
    expect(resolveWholeAvatarPath('girl', state, 0, girlAppearance)).toMatch(
      /^\/sprites\/avatar\/whole\/moonlight-academy\/girl_.+_01\.png$/,
    )
  })

  it.each(ALL_STATES)('resolves every boy state through the moonlight academy family: %s', (state) => {
    expect(resolveWholeAvatarPath('boy', state, 0, boyAppearance)).toMatch(
      /^\/sprites\/avatar\/whole\/moonlight-academy\/boy_.+_01\.png$/,
    )
  })

  it('reports the shop item as supported for both genders', () => {
    expect(isWholeAvatarItemSupportedForGender('skin-moonlight-academy', 'girl')).toBe(true)
    expect(isWholeAvatarItemSupportedForGender('skin-moonlight-academy', 'boy')).toBe(true)
  })
})

describe('hair-color-black registration', () => {
  it('is registered as a whole-avatar variant', () => {
    expect(WHOLE_AVATAR_VARIANTS.some((v) => v.id === 'hair-color-black')).toBe(true)
  })

  it('is registered for both genders', () => {
    const variant = WHOLE_AVATAR_VARIANTS.find((v) => v.id === 'hair-color-black')!
    expect(variant.supportedGenders).toEqual(['girl', 'boy'])
  })
})

describe('rainy study cafe complete seasonal skin', () => {
  const girlAppearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['skin-rainy-study-cafe'] }
  const boyAppearance = { ...DEFAULT_PRESETS.boy, equippedAssetIds: ['skin-rainy-study-cafe'] }

  it('is registered for both genders', () => {
    const variant = WHOLE_AVATAR_VARIANTS.find((candidate) => candidate.id === 'skin-rainy-study-cafe')
    expect(variant?.supportedGenders).toEqual(['girl', 'boy'])
  })

  it.each(ALL_STATES)('resolves every girl state through the rainy cafe family: %s', (state) => {
    expect(resolveWholeAvatarPath('girl', state, 0, girlAppearance)).toMatch(
      /^\/sprites\/avatar\/whole\/rainy-study-cafe\/girl_.+_01\.png$/,
    )
  })

  it.each(ALL_STATES)('resolves every boy state through the rainy cafe family: %s', (state) => {
    expect(resolveWholeAvatarPath('boy', state, 0, boyAppearance)).toMatch(
      /^\/sprites\/avatar\/whole\/rainy-study-cafe\/boy_.+_01\.png$/,
    )
  })

  it('reports the shop item as supported for both genders', () => {
    expect(isWholeAvatarItemSupportedForGender('skin-rainy-study-cafe', 'girl')).toBe(true)
    expect(isWholeAvatarItemSupportedForGender('skin-rainy-study-cafe', 'boy')).toBe(true)
  })
})

describe('required test 3 — girl + hair-color-black resolves every state/frame to the black-hair whole-avatar path', () => {
  const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black'] }

  it.each(ALL_STATES)('resolves state %s to the black-hair path family', (state) => {
    const path = resolveWholeAvatarPath('girl', state, 0, appearance)
    expect(path).toMatch(/^\/sprites\/avatar\/whole\/black-hair\/girl_.+_01\.png$/)
  })

  it('resolves a real frame index with correct zero-padding', () => {
    expect(resolveWholeAvatarPath('girl', 'celebrate', 11, appearance)).toBe(
      '/sprites/avatar/whole/black-hair/girl_celebrate_12.png',
    )
  })

  it('resolves the exact documented example paths', () => {
    expect(resolveWholeAvatarPath('girl', 'idle', 0, appearance)).toBe(
      '/sprites/avatar/whole/black-hair/girl_idle_01.png',
    )
    expect(resolveWholeAvatarPath('girl', 'study', 0, appearance)).toBe(
      '/sprites/avatar/whole/black-hair/girl_study_01.png',
    )
    expect(resolveWholeAvatarPath('girl', 'sleep', 0, appearance)).toBe(
      '/sprites/avatar/whole/black-hair/girl_sleep_01.png',
    )
    expect(resolveWholeAvatarPath('girl', 'happy', 0, appearance)).toBe(
      '/sprites/avatar/whole/black-hair/girl_happy_01.png',
    )
  })
})

describe('boy + hair-color-black complete family', () => {
  const appearance = { ...DEFAULT_PRESETS.boy, equippedAssetIds: ['hair-color-black'] }

  it('resolves a whole-avatar variant for boy', () => {
    expect(resolveWholeAvatarVariant(appearance, 'boy')?.id).toBe('hair-color-black')
  })

  it.each(ALL_STATES)('resolves black hair for state %s', (state) => {
    const path = resolveWholeAvatarPath('boy', state, 0, appearance)
    expect(path).toMatch(/^\/sprites\/avatar\/whole\/black-hair\/boy_.+_01\.png$/)
  })

  it('returns the delivered boy black-hair path', () => {
    const path = resolveWholeAvatarPath('boy', 'study', 0, appearance)
    expect(path).toBe('/sprites/avatar/whole/black-hair/boy_study_01.png')
  })
})

describe('required test 5 — unsupported additional items do not remove the black-hair variant', () => {
  it('keeps the black-hair variant when an unregistered ribbon id is also equipped', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black', 'hair-ribbon'] }
    const variant = resolveWholeAvatarVariant(appearance, 'girl')
    expect(variant?.id).toBe('hair-color-black')
    expect(resolveWholeAvatarPath('girl', 'idle', 0, appearance)).toBe(
      '/sprites/avatar/whole/black-hair/girl_idle_01.png',
    )
  })

  it('keeps matching regardless of how many other unsupported items are also equipped', () => {
    const appearance = {
      ...DEFAULT_PRESETS.girl,
      equippedAssetIds: ['hair-color-black', 'acc-glasses', 'acc-necklace', 'outfit-blue'],
    }
    expect(resolveWholeAvatarVariant(appearance, 'girl')?.id).toBe('hair-color-black')
  })
})

describe('required test 6 — a more-specific future complete variant wins over a less-specific one', () => {
  // A synthetic registry standing in for a hypothetical future delivery: a
  // complete "black-hair + ribbon" baked variant alongside the real
  // single-item black-hair variant. WHOLE_AVATAR_VARIANTS only has one real
  // entry today, so resolveWholeAvatarVariant's optional `variants`
  // override (added specifically for this) is what makes the "two
  // candidates, most-specific wins" branch reachable at all.
  const singleItemVariant = {
    id: 'hair-color-black',
    equippedAssetIds: ['hair-color-black'],
    supportedGenders: ['girl'] as const,
    path: () => '/sprites/avatar/whole/black-hair/girl_idle_01.png',
  }
  const twoItemVariant = {
    id: 'hair-color-black+hair-ribbon',
    equippedAssetIds: ['hair-color-black', 'hair-ribbon'],
    supportedGenders: ['girl'] as const,
    path: () => '/sprites/avatar/whole/black-hair-ribbon/girl_idle_01.png',
  }
  const synthetic = [singleItemVariant, twoItemVariant]

  it('picks the single-item variant when only its one required id is equipped', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black'] }
    expect(resolveWholeAvatarVariant(appearance, 'girl', synthetic)?.id).toBe('hair-color-black')
  })

  it('picks the more-specific 2-item variant once both its required ids are equipped', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black', 'hair-ribbon'] }
    expect(resolveWholeAvatarVariant(appearance, 'girl', synthetic)?.id).toBe('hair-color-black+hair-ribbon')
  })

  it('order in the registry array does not affect which variant wins — specificity does', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black', 'hair-ribbon'] }
    const reversed = [twoItemVariant, singleItemVariant]
    expect(resolveWholeAvatarVariant(appearance, 'girl', reversed)?.id).toBe('hair-color-black+hair-ribbon')
  })
})

describe('isWholeAvatarItemSupportedForGender', () => {
  it('is true for hair-color-black + girl', () => {
    expect(isWholeAvatarItemSupportedForGender('hair-color-black', 'girl')).toBe(true)
  })

  it('is true for hair-color-black + boy', () => {
    expect(isWholeAvatarItemSupportedForGender('hair-color-black', 'boy')).toBe(true)
  })

  it('reports the ribbon as covered by its complete two-item variant for both genders', () => {
    expect(isWholeAvatarItemSupportedForGender('hair-ribbon', 'girl')).toBe(true)
    expect(isWholeAvatarItemSupportedForGender('hair-ribbon', 'boy')).toBe(true)
  })
})

describe('renderer fallback — resolveWholeAvatarPathWithFallback', () => {
  it('required test 1 — a matched variant appearance resolves a black-hair primary distinct from its fallback', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black'] }
    const { primary, fallback } = resolveWholeAvatarPathWithFallback('girl', 'study', 0, appearance)
    expect(primary).toBe('/sprites/avatar/whole/black-hair/girl_study_01.png')
    expect(fallback).toBe('/sprites/avatar/base/girl_study_01.png')
    expect(primary).not.toBe(fallback)
  })

  it('boy black hair has a distinct base fallback; default girl does not', () => {
    const boyAppearance = { ...DEFAULT_PRESETS.boy, equippedAssetIds: ['hair-color-black'] }
    const boyResolution = resolveWholeAvatarPathWithFallback('boy', 'study', 0, boyAppearance)
    expect(boyResolution.primary).toContain('black-hair')
    expect(boyResolution.fallback).toContain('/base/')

    const defaultGirlAppearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: [] }
    const girlResolution = resolveWholeAvatarPathWithFallback('girl', 'study', 0, defaultGirlAppearance)
    expect(girlResolution.primary).toBe(girlResolution.fallback)
    expect(girlResolution.primary).toBe('/sprites/avatar/base/girl_study_01.png')
  })

  it('required test 7 — unsupported additional items still resolve the black-hair primary', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black', 'acc-glasses'] }
    const { primary } = resolveWholeAvatarPathWithFallback('girl', 'idle', 0, appearance)
    expect(primary).toBe('/sprites/avatar/whole/black-hair/girl_idle_01.png')
  })
})

describe('renderer fallback — resolveWholeAvatarLoadState (docs/... black hair loading-failure fix)', () => {
  const girlWithBlackHair = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black'] }
  const resolution = resolveWholeAvatarPathWithFallback('girl', 'study', 0, girlWithBlackHair)

  it('required test 1 — no failure yet: uses the black-hair primary, and it is not the final attempt', () => {
    const state = resolveWholeAvatarLoadState(resolution, null)
    expect(state.src).toBe(resolution.primary)
    expect(state.src).toContain('black-hair')
    expect(state.isFinalAttempt).toBe(false)
  })

  it('required test 2 — after the primary has failed, switches to the default base PNG as a final attempt', () => {
    const state = resolveWholeAvatarLoadState(resolution, resolution.primary)
    expect(state.src).toBe(resolution.fallback)
    expect(state.src).toBe('/sprites/avatar/base/girl_study_01.png')
    expect(state.isFinalAttempt).toBe(true)
  })

  it('required test 3 — the fallback itself is always the last resort (never a third path to retry)', () => {
    // resolveWholeAvatarLoadState never looks past `fallback` — once the
    // renderer is on `fallback` and that also errors, isFinalAttempt (true
    // above) is what tells WholeAvatarRenderer to call `onError` and let
    // CharacterView switch to ChibiFallbackArt (SVG). There is no further
    // state this function can transition to from here.
    const state = resolveWholeAvatarLoadState(resolution, resolution.primary)
    expect(state.isFinalAttempt).toBe(true)
  })

  it('required test 4 — a state/frame change (new primary) is retried fresh, ignoring an older failure', () => {
    const previousFailure = resolution.primary // e.g. girl_study_01 had failed
    const nextResolution = resolveWholeAvatarPathWithFallback('girl', 'happy', 0, girlWithBlackHair)
    const state = resolveWholeAvatarLoadState(nextResolution, previousFailure)
    expect(state.src).toBe(nextResolution.primary)
    expect(state.src).toBe('/sprites/avatar/whole/black-hair/girl_happy_01.png')
    expect(state.isFinalAttempt).toBe(false)
  })

  it('a frame whose primary already failed stays on its fallback if the animation loops back to it, without re-requesting the broken URL', () => {
    const state = resolveWholeAvatarLoadState(resolution, resolution.primary)
    expect(state.src).toBe(resolution.fallback)
  })

  it('boy gets black hair first and retains a safe base fallback', () => {
    const boyAppearance = { ...DEFAULT_PRESETS.boy, equippedAssetIds: ['hair-color-black'] }
    const boyResolution = resolveWholeAvatarPathWithFallback('boy', 'study', 0, boyAppearance)
    const state = resolveWholeAvatarLoadState(boyResolution, null)
    expect(state.src).toContain('black-hair')
    expect(state.isFinalAttempt).toBe(false)
  })

  it('required test 6 — a default brown-hair user keeps the original single-attempt-then-SVG behavior', () => {
    const defaultAppearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: [] }
    const defaultResolution = resolveWholeAvatarPathWithFallback('girl', 'study', 0, defaultAppearance)
    const state = resolveWholeAvatarLoadState(defaultResolution, null)
    expect(state.src).toBe('/sprites/avatar/base/girl_study_01.png')
    expect(state.isFinalAttempt).toBe(true)
  })
})

describe('resolveWholeAvatarPath stays equal to resolveWholeAvatarPathWithFallback(...).primary', () => {
  it('keeps the single-path helper consistent with the fallback-pair helper for a matched variant', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['hair-color-black'] }
    expect(resolveWholeAvatarPath('girl', 'idle', 2, appearance)).toBe(
      resolveWholeAvatarPathWithFallback('girl', 'idle', 2, appearance).primary,
    )
  })

  it('keeps the single-path helper consistent with the fallback-pair helper for no matched variant', () => {
    const appearance = { ...DEFAULT_PRESETS.boy, equippedAssetIds: [] }
    expect(resolveWholeAvatarPath('boy', 'sleep', 1, appearance)).toBe(
      resolveWholeAvatarPathWithFallback('boy', 'sleep', 1, appearance).primary,
    )
  })
})

describe('sakura uniform complete skin', () => {
  const appearance = {
    ...DEFAULT_PRESETS.girl,
    equippedAssetIds: ['skin-sakura-uniform-girl', 'hair-color-black'],
  }

  it('wins over black hair in every state', () => {
    for (const state of ALL_STATES) {
      expect(resolveWholeAvatarPath('girl', state, 0, appearance)).toContain('/whole/sakura-uniform/')
    }
  })

  it('uses sakura, black hair, then base as the ordered failure chain', () => {
    expect(resolveWholeAvatarSourceChain('girl', 'study', 0, appearance)).toEqual([
      '/sprites/avatar/whole/sakura-uniform/girl_study_01.png',
      '/sprites/avatar/whole/black-hair/girl_study_01.png',
      '/sprites/avatar/base/girl_study_01.png',
    ])
  })

  it('resolves the complete male skin family for boy', () => {
    const sources = resolveWholeAvatarSourceChain('boy', 'study', 0, appearance)
    expect(sources).toEqual([
      '/sprites/avatar/whole/sakura-uniform/boy_study_01.png',
      '/sprites/avatar/whole/black-hair/boy_study_01.png',
      '/sprites/avatar/base/boy_study_01.png',
    ])
  })

  it('uses the male skin in Home, Timer and Capture representative states', () => {
    expect(resolveWholeAvatarPath('boy', 'idle', 0, appearance)).toBe(
      '/sprites/avatar/whole/sakura-uniform/boy_idle_01.png',
    )
    expect(resolveWholeAvatarPath('boy', 'study', 0, appearance)).toBe(
      '/sprites/avatar/whole/sakura-uniform/boy_study_01.png',
    )
    expect(resolveWholeAvatarPath('boy', 'happy', 0, appearance)).toBe(
      '/sprites/avatar/whole/sakura-uniform/boy_happy_01.png',
    )
  })

  it('covers every male state with the male skin family', () => {
    for (const state of ALL_STATES) {
      expect(resolveWholeAvatarPath('boy', state, 0, appearance)).toMatch(
        /^\/sprites\/avatar\/whole\/sakura-uniform\/boy_.+_01\.png$/,
      )
    }
  })

  it('reports the skin as supported for both genders', () => {
    expect(isWholeAvatarItemSupportedForGender('skin-sakura-uniform-girl', 'girl')).toBe(true)
    expect(isWholeAvatarItemSupportedForGender('skin-sakura-uniform-girl', 'boy')).toBe(true)
  })
})

describe('sakura uniform + ribbon baked combination', () => {
  const appearance = {
    ...DEFAULT_PRESETS.girl,
    equippedAssetIds: ['skin-sakura-uniform-girl', 'hair-ribbon'],
  }

  it('selects the complete combination for both genders', () => {
    expect(resolveWholeAvatarPath('girl', 'study', 0, appearance)).toBe(
      '/sprites/avatar/whole/sakura-uniform-ribbon/girl_study_01.png',
    )
    expect(resolveWholeAvatarPath('boy', 'happy', 0, appearance)).toBe(
      '/sprites/avatar/whole/sakura-uniform-ribbon/boy_happy_01.png',
    )
  })

  it('falls back through plain sakura and base without any runtime accessory layer', () => {
    expect(resolveWholeAvatarSourceChain('girl', 'sleep', 0, appearance)).toEqual([
      '/sprites/avatar/whole/sakura-uniform-ribbon/girl_sleep_01.png',
      '/sprites/avatar/whole/sakura-uniform/girl_sleep_01.png',
      '/sprites/avatar/base/girl_sleep_01.png',
    ])
  })
})
