import { describe, expect, it } from 'vitest'
import type { StudySession } from '../types'
import { deriveDailyQuests } from './dailyQuests'

const key = '2026-08-21'
const session = (subjectId: string, durationSec: number, dateKey = key): StudySession => ({
  id: `${subjectId}-${durationSec}`, subjectId, durationSec, dateKey, startedAt: 0,
})

describe('deriveDailyQuests', () => {
  it('ignores sessions from other days', () => {
    const quests = deriveDailyQuests([session('math', 3600, '2026-08-20')], key)
    expect(quests.every((quest) => !quest.complete)).toBe(true)
  })

  it('derives completion from real duration and subject variety', () => {
    const quests = deriveDailyQuests([session('math', 1200), session('english', 600)], key)
    expect(quests.map((quest) => quest.complete)).toEqual([true, true, true])
  })

  it('clamps visible progress at each target', () => {
    const focus = deriveDailyQuests([session('math', 7200)], key)[1]
    expect(focus).toMatchObject({ current: 30, percent: 100, complete: true })
  })
})
