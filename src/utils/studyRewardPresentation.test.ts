import { describe, expect, it } from 'vitest'
import { deriveStudyRewardPresentation } from './studyRewardPresentation'

describe('study reward completion copy', () => {
  it('never claims that zero earned points were received', () => {
    const copy = deriveStudyRewardPresentation(0)
    expect(copy.shopCta).toBe('새 스킨 미리보기 🛍️')
    expect(copy.shopCta).not.toContain('받은 포인트')
    expect(copy.zeroRewardHint).toContain('+2P')
  })

  it('keeps the earned-points shop CTA for a real study reward', () => {
    const copy = deriveStudyRewardPresentation(1)
    expect(copy.shopCta).toContain('받은 포인트')
    expect(copy.zeroRewardTitle).toBe('')
  })
})
