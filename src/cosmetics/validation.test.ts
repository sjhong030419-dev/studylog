import { describe, expect, it } from 'vitest'
import { COSMETIC_CATALOG } from './catalog'
import type { CosmeticItemDefinition } from './types'
import { validateCosmeticCatalog } from './validation'

function makeItem(overrides: Partial<CosmeticItemDefinition> = {}): CosmeticItemDefinition {
  return {
    id: 'test-item',
    name: 'Test Item',
    slot: 'headAccessory',
    rarity: 'unassigned',
    acquisitionType: 'points',
    zIndex: 10,
    compatibleGenders: 'all',
    supportedStates: [],
    ...overrides,
  }
}

describe('validateCosmeticCatalog', () => {
  it('reports no issues for a clean catalog with only the 2 required slots (hair, outfit) defaulted', () => {
    const catalog = [
      makeItem({ id: 'a', slot: 'hair', defaultOwned: true }),
      makeItem({ id: 'b', slot: 'outfit', defaultOwned: true }),
    ]
    expect(validateCosmeticCatalog(catalog)).toEqual([])
  })

  it('never flags optional slots (headAccessory/faceAccessory/neckAccessory) for a missing default, even with zero items in them', () => {
    const catalog = [makeItem({ id: 'a', slot: 'hair', defaultOwned: true }), makeItem({ id: 'b', slot: 'outfit', defaultOwned: true })]
    // No headAccessory/faceAccessory/neckAccessory item at all — a
    // character with nothing equipped in any of them is valid, not a gap.
    expect(validateCosmeticCatalog(catalog)).toEqual([])
  })

  it('catches a duplicate id', () => {
    const catalog = [makeItem({ id: 'dup' }), makeItem({ id: 'dup' })]
    const issues = validateCosmeticCatalog(catalog)
    expect(issues.some((i) => i.type === 'duplicate-id' && i.itemId === 'dup')).toBe(true)
  })

  it('catches an invalid (negative) z-index', () => {
    const issues = validateCosmeticCatalog([makeItem({ id: 'bad-z', zIndex: -1 })])
    expect(issues.some((i) => i.type === 'invalid-z-index' && i.itemId === 'bad-z')).toBe(true)
  })

  it('catches a non-finite z-index', () => {
    const issues = validateCosmeticCatalog([makeItem({ id: 'nan-z', zIndex: Number.NaN })])
    expect(issues.some((i) => i.type === 'invalid-z-index' && i.itemId === 'nan-z')).toBe(true)
  })

  it('catches an incompatible/unsupported state declaration', () => {
    // Cast bypasses the CosmeticSupportedState type on purpose — this
    // guards against a hand-authored catalog entry (not caught by TS at
    // the call site) declaring a state outside the 4 MVP states.
    const badState = 'excited' as unknown as CosmeticItemDefinition['supportedStates'][number]
    const issues = validateCosmeticCatalog([makeItem({ id: 'bad-state', supportedStates: [badState] })])
    expect(issues.some((i) => i.type === 'incompatible-state' && i.itemId === 'bad-state')).toBe(true)
  })

  it('flags a required slot (hair) with no defaultOwned item, while a fully-defaulted required slot (outfit) stays silent', () => {
    const catalog = [
      makeItem({ id: 'a', slot: 'hair', defaultOwned: false }),
      makeItem({ id: 'b', slot: 'outfit', defaultOwned: true }),
    ]
    const issues = validateCosmeticCatalog(catalog)
    expect(issues).toEqual([{ type: 'missing-default-for-slot', message: expect.any(String), slot: 'hair' }])
  })

  it('flags a required slot with zero items at all the same way as zero defaults', () => {
    const catalog = [makeItem({ id: 'b', slot: 'outfit', defaultOwned: true })]
    const issues = validateCosmeticCatalog(catalog)
    const missingSlots = issues.filter((i) => i.type === 'missing-default-for-slot').map((i) => i.slot)
    expect(missingSlots).toEqual(['hair'])
  })

  describe('honest current gap — regression guard, should start failing loudly once real default items exist', () => {
    it('the real derived catalog has no default-owned item for either required slot yet (none of the 12 existing shop items are free/starter items)', () => {
      const issues = validateCosmeticCatalog(COSMETIC_CATALOG)
      const missingDefaultSlots = issues.filter((i) => i.type === 'missing-default-for-slot').map((i) => i.slot).sort()
      expect(missingDefaultSlots).toEqual(['hair', 'outfit'])
    })

    it('the real derived catalog has zero duplicate-id, invalid-z-index, or incompatible-state issues', () => {
      const issues = validateCosmeticCatalog(COSMETIC_CATALOG)
      const otherIssues = issues.filter((i) => i.type !== 'missing-default-for-slot')
      expect(otherIssues).toEqual([])
    })
  })
})
