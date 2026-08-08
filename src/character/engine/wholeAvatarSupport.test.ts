import { describe, expect, it } from 'vitest'
import { DEFAULT_PRESETS } from '../presets/defaultPresets'
import { resolveWholeAvatarPath, resolveWholeAvatarVariant, WHOLE_AVATAR_VARIANTS } from './wholeAvatarSupport'

describe('whole-avatar MVP rendering policy', () => {
  it('starts with no partially delivered cosmetic variants', () => {
    expect(WHOLE_AVATAR_VARIANTS).toHaveLength(0)
  })

  it('uses the approved complete base image for the default appearance', () => {
    expect(resolveWholeAvatarPath('girl', 'study', 0, DEFAULT_PRESETS.girl)).toBe(
      '/sprites/avatar/base/girl_study_01.png',
    )
  })

  it('keeps the complete default image when an item has no approved baked variant', () => {
    const appearance = { ...DEFAULT_PRESETS.girl, equippedAssetIds: ['outfit-hoodie', 'acc-ribbon'] }
    expect(resolveWholeAvatarVariant(appearance)).toBeUndefined()
    expect(resolveWholeAvatarPath('girl', 'study', 4, appearance)).toBe('/sprites/avatar/base/girl_study_05.png')
  })
})
