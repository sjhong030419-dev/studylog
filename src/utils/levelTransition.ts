import { deriveExpLevel } from '../character/engine/expLevel'

/**
 * The "before" level to show on the capture card's level badge — undefined
 * whenever there's nothing meaningful to show: no Study XP was earned
 * today, or today's XP didn't actually cross a level boundary. Never a
 * same-level "Lv.1 -> Lv.1" transition (PRD §14).
 */
export function deriveLevelBeforeToday(
  studyXpTotal: number,
  studyXpBeforeTodaysLastSession: number | undefined,
): number | undefined {
  if (studyXpBeforeTodaysLastSession === undefined) return undefined
  const before = deriveExpLevel(studyXpBeforeTodaysLastSession).level
  const after = deriveExpLevel(studyXpTotal).level
  return before !== after ? before : undefined
}
