// Shared ranking data/logic, extracted from RankingBoard so the Home
// screen's growth summary and the Ranking screen derive "my rank" from a
// single source instead of duplicating the dummy roster.

export interface DummyEntry {
  id: string
  name: string
  emoji: string
  sec: number
}

export interface DummySchool {
  id: string
  name: string
  avgSec: number
  memberCount: number
}

export const FRIEND_DUMMIES: DummyEntry[] = [
  { id: 'f1', name: '민지', emoji: '🐰', sec: 3 * 3600 + 20 * 60 },
  { id: 'f2', name: '하늘', emoji: '🐼', sec: 2 * 3600 + 45 * 60 },
  { id: 'f3', name: '준서', emoji: '🐣', sec: 1 * 3600 + 10 * 60 },
]

export const ALL_DUMMIES: DummyEntry[] = [
  ...FRIEND_DUMMIES,
  { id: 'a1', name: '공스타_수아', emoji: '🦊', sec: 6 * 3600 + 5 * 60 },
  { id: 'a2', name: '새벽별', emoji: '🐨', sec: 5 * 3600 + 12 * 60 },
  { id: 'a3', name: '열품타장인', emoji: '🐯', sec: 4 * 3600 + 30 * 60 },
  { id: 'a4', name: '도영', emoji: '🐸', sec: 55 * 60 },
]

export const DUMMY_SCHOOLS: DummySchool[] = [
  { id: 's1', name: '한빛고등학교', avgSec: 3 * 3600 + 40 * 60, memberCount: 128 },
  { id: 's2', name: '서울고등학교', avgSec: 3 * 3600 + 10 * 60, memberCount: 96 },
  { id: 's3', name: '대한고등학교', avgSec: 2 * 3600 + 50 * 60, memberCount: 74 },
  { id: 's4', name: '미래고등학교', avgSec: 2 * 3600 + 20 * 60, memberCount: 51 },
]

export function rankedAll(myTodaySec: number): DummyEntry[] {
  return [...ALL_DUMMIES, { id: 'me', name: '나', emoji: '📖', sec: myTodaySec }].sort(
    (a, b) => b.sec - a.sec,
  )
}

export function myOverallRank(myTodaySec: number): { rank: number; total: number } {
  const list = rankedAll(myTodaySec)
  const rank = list.findIndex((e) => e.id === 'me') + 1
  return { rank, total: list.length }
}
