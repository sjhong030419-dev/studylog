import { describe, expect, it } from 'vitest'
import type { StudySession } from '../types'
import { allDailyQuestsComplete, deriveDailyQuests } from './dailyQuests'

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

  it('two sessions in the same subject do not complete the two-subjects quest', () => {
    const quests = deriveDailyQuests([session('math', 600), session('math', 1200)], key)
    const twoSubjects = quests.find((quest) => quest.id === 'two-subjects')
    expect(twoSubjects).toMatchObject({ current: 1, complete: false })
  })
})

describe('allDailyQuestsComplete', () => {
  // Boundary regression for the capture card's "오늘의 퀘스트 완료!" claim
  // (docs/Claude_3Hour_MVP_Quality_Sprint.md §4.4/§5): that text must only
  // ever be true when every quest is actually done, never just "studied at
  // all today".
  it('is false the moment any study happens but before any quest is done', () => {
    expect(allDailyQuestsComplete([session('math', 1)], key)).toBe(false)
  })

  it('is false at 29:59 of focus time even with 2 subjects (focus-30 not yet met)', () => {
    const sessions = [session('math', 1000), session('english', 799)] // 1799s total
    expect(allDailyQuestsComplete(sessions, key)).toBe(false)
  })

  it('is true at exactly 30:00 combined with 2 subjects and a first session', () => {
    const sessions = [session('math', 1200), session('english', 600)] // 1800s total, 2 subjects
    expect(allDailyQuestsComplete(sessions, key)).toBe(true)
  })

  it('is false with 30+ minutes in a single subject (two-subjects quest still incomplete)', () => {
    expect(allDailyQuestsComplete([session('math', 1800)], key)).toBe(false)
  })

  it('ignores sessions from other days, matching per-quest date scoping', () => {
    const sessions = [session('math', 1200, '2026-08-20'), session('english', 600, '2026-08-20')]
    expect(allDailyQuestsComplete(sessions, key)).toBe(false)
  })
})
