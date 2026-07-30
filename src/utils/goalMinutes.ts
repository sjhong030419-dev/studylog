export type GoalMinutesParseResult =
  | { valid: true; minutes: number | null }
  | { valid: false; error: string }

const ERROR_MESSAGE = '목표 시간은 1~600 사이의 정수(분)로 입력해주세요.'

/**
 * Validates the onboarding daily-goal-minutes input (PRD onboarding goal
 * step). An empty/blank input is a valid "no goal" choice; anything else
 * must be a whole number between 1 and 600 — never silently clamped, since
 * a rejected value should surface as an error the user can fix rather than
 * being quietly reinterpreted.
 */
export function parseGoalMinutes(raw: string): GoalMinutesParseResult {
  const trimmed = raw.trim()
  if (trimmed === '') return { valid: true, minutes: null }

  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < 1 || n > 600) {
    return { valid: false, error: ERROR_MESSAGE }
  }

  return { valid: true, minutes: n }
}
