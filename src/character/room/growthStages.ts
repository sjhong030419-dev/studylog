import type { GrowthStage } from '../types'

/** docs/character-system.md §6. Cumulative: everything unlocked at or below
 * the current level stays visible (the room only ever grows). */
export const GROWTH_STAGES: GrowthStage[] = [
  { level: 1, label: '시작의 책상', additions: ['desk'] },
  { level: 10, label: '식물 추가', additions: ['plant'] },
  { level: 20, label: '고양이 등장', additions: ['cat'] },
  { level: 30, label: '의자 업그레이드', additions: ['chairUpgrade'] },
  { level: 40, label: '책 증가', additions: ['moreBooks'] },
  { level: 50, label: '듀얼 모니터', additions: ['dualMonitor'] },
  { level: 70, label: '창문과 커튼', additions: ['window'] },
  { level: 100, label: 'Premium Study Room', additions: ['premium'] },
]

export function currentGrowthStage(level: number): GrowthStage {
  let current = GROWTH_STAGES[0]
  for (const stage of GROWTH_STAGES) {
    if (level >= stage.level) current = stage
  }
  return current
}

/** All addition ids unlocked at or below `level`, cumulative across stages. */
export function unlockedAdditions(level: number): Set<string> {
  const ids = new Set<string>()
  for (const stage of GROWTH_STAGES) {
    if (level >= stage.level) {
      for (const id of stage.additions) ids.add(id)
    }
  }
  return ids
}
