import { REQUIRED_CHARACTER_SLOTS, type CosmeticItemDefinition, type CosmeticSlot } from './types'

export type CosmeticValidationIssueType =
  | 'duplicate-id'
  | 'invalid-z-index'
  | 'missing-default-for-slot'
  | 'incompatible-state'

export interface CosmeticValidationIssue {
  type: CosmeticValidationIssueType
  message: string
  itemId?: string
  slot?: CosmeticSlot
}

const VALID_SUPPORTED_STATES = new Set(['idle', 'study', 'sleep', 'happy'])

/**
 * Catalog-wide checks (docs/StudyLog_Cosmetic_System_PRD_v1.0.md §13 Phase 1,
 * §14). Returns a list of issues instead of throwing — a broken catalog
 * entry must never crash the app (PRD §11 "fail safely"), so this is meant
 * to run in tests and dev warnings, not as a runtime guard that blocks
 * rendering.
 */
export function validateCosmeticCatalog(catalog: CosmeticItemDefinition[]): CosmeticValidationIssue[] {
  const issues: CosmeticValidationIssue[] = []

  const seenIds = new Set<string>()
  for (const item of catalog) {
    if (seenIds.has(item.id)) {
      issues.push({ type: 'duplicate-id', message: `Duplicate item id: ${item.id}`, itemId: item.id })
    }
    seenIds.add(item.id)

    if (!Number.isFinite(item.zIndex) || item.zIndex < 0) {
      issues.push({
        type: 'invalid-z-index',
        message: `Item ${item.id} has an invalid zIndex: ${item.zIndex}`,
        itemId: item.id,
        slot: item.slot,
      })
    }

    for (const state of item.supportedStates) {
      if (!VALID_SUPPORTED_STATES.has(state)) {
        issues.push({
          type: 'incompatible-state',
          message: `Item ${item.id} declares unsupported state: ${state}`,
          itemId: item.id,
          slot: item.slot,
        })
      }
    }
  }

  // Only REQUIRED_CHARACTER_SLOTS (hair, outfit — types.ts) are checked here.
  // OPTIONAL_CHARACTER_SLOTS (headAccessory/faceAccessory/neckAccessory) are
  // deliberately never checked: a character with nothing equipped in any of
  // them is a normal, valid state, not a gap to flag.
  for (const slot of REQUIRED_CHARACTER_SLOTS) {
    const hasDefault = catalog.some((item) => item.slot === slot && item.defaultOwned)
    if (!hasDefault) {
      issues.push({
        type: 'missing-default-for-slot',
        message: `No default-owned item declared for required slot: ${slot}`,
        slot,
      })
    }
  }

  return issues
}
