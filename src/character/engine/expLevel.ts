/**
 * EXP-driven leveling (docs/character-system.md §8, "EXPERIENCE BAR: Lv.24,
 * EXP 2,450 / 4,000"). Replaces the earlier time-based `deriveStudyLevel`
 * (utils/level.ts) — the reference design explicitly uses an EXP bar, and
 * having both a time-based and a points-based "level" would be two
 * conflicting sources of truth for the same room-growth mechanic.
 *
 * EXP is Study XP — lifetime points earned specifically from study
 * sessions (`pointsStore.studyXpTotal()`), never the spendable balance and
 * never advertising/bonus points. Spending points on a cosmetic, or
 * watching an ad, must never change the character's level.
 *
 * Curve: a standard RPG-style power curve, `EXP to clear level L = BASE *
 * L^EXPONENT`. Nothing is stored — level is always a pure function of
 * lifetime EXP, so it can't drift out of sync or be fabricated.
 */
export const EXP_BASE = 20
export const EXP_EXPONENT = 1.5

export interface ExpLevel {
  level: number
  exp: number
  expIntoLevel: number
  expForNextLevel: number
  progressRatio: number
}

/** EXP needed to advance from `level` to `level + 1`. */
export function expRequiredForLevel(level: number): number {
  return Math.round(EXP_BASE * Math.pow(Math.max(1, level), EXP_EXPONENT))
}

export function deriveExpLevel(totalExp: number): ExpLevel {
  const exp = Math.max(0, Math.floor(totalExp))
  let level = 1
  let remaining = exp

  // Levels only ever need double-digit-to-low-hundreds iterations for any
  // realistic EXP total, so a loop is simpler and clearer than inverting
  // the power-curve sum algebraically.
  while (true) {
    const needed = expRequiredForLevel(level)
    if (remaining < needed) {
      return {
        level,
        exp,
        expIntoLevel: remaining,
        expForNextLevel: needed,
        progressRatio: needed > 0 ? remaining / needed : 0,
      }
    }
    remaining -= needed
    level += 1
  }
}
