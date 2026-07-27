import { useState } from 'react'
import { todaySessions, useTimerStore } from '../../store/timerStore'
import { usePointsStore, STREAK_MILESTONES } from '../../store/pointsStore'
import { formatDuration } from '../../utils/time'
import { PointHistoryList } from '../points/PointHistoryList'

type Scope = 'all' | 'friends' | 'school'
type View = 'ranking' | 'history'

interface DummyEntry {
  id: string
  name: string
  emoji: string
  sec: number
}

interface DummySchool {
  id: string
  name: string
  avgSec: number
  memberCount: number
}

const FRIEND_DUMMIES: DummyEntry[] = [
  { id: 'f1', name: '민지', emoji: '🐰', sec: 3 * 3600 + 20 * 60 },
  { id: 'f2', name: '하늘', emoji: '🐼', sec: 2 * 3600 + 45 * 60 },
  { id: 'f3', name: '준서', emoji: '🐣', sec: 1 * 3600 + 10 * 60 },
]

const ALL_DUMMIES: DummyEntry[] = [
  ...FRIEND_DUMMIES,
  { id: 'a1', name: '공스타_수아', emoji: '🦊', sec: 6 * 3600 + 5 * 60 },
  { id: 'a2', name: '새벽별', emoji: '🐨', sec: 5 * 3600 + 12 * 60 },
  { id: 'a3', name: '열품타장인', emoji: '🐯', sec: 4 * 3600 + 30 * 60 },
  { id: 'a4', name: '도영', emoji: '🐸', sec: 55 * 60 },
]

const DUMMY_SCHOOLS: DummySchool[] = [
  { id: 's1', name: '한빛고등학교', avgSec: 3 * 3600 + 40 * 60, memberCount: 128 },
  { id: 's2', name: '서울고등학교', avgSec: 3 * 3600 + 10 * 60, memberCount: 96 },
  { id: 's3', name: '대한고등학교', avgSec: 2 * 3600 + 50 * 60, memberCount: 74 },
  { id: 's4', name: '미래고등학교', avgSec: 2 * 3600 + 20 * 60, memberCount: 51 },
]

function secToPoints(sec: number): number {
  return Math.floor(sec / 60)
}

function nextMilestone(streak: number): number | null {
  const milestones = Object.keys(STREAK_MILESTONES)
    .map(Number)
    .sort((a, b) => a - b)
  return milestones.find((m) => m > streak) ?? null
}

export function RankingBoard() {
  const sessions = useTimerStore((s) => s.sessions)
  const balance = usePointsStore((s) => s.balance())
  const streakCount = usePointsStore((s) => s.streakCount)
  const school = usePointsStore((s) => s.school)
  const setSchool = usePointsStore((s) => s.setSchool)

  const [scope, setScope] = useState<Scope>('all')
  const [view, setView] = useState<View>('ranking')
  const [schoolInput, setSchoolInput] = useState('')

  const myTodaySec = todaySessions(sessions).reduce((sum, s) => sum + s.durationSec, 0)
  const upcoming = nextMilestone(streakCount)

  const personEntries =
    scope === 'friends'
      ? FRIEND_DUMMIES
      : scope === 'all'
        ? ALL_DUMMIES
        : []

  const sortedPeople = [...personEntries, { id: 'me', name: '나', emoji: '📖', sec: myTodaySec }].sort(
    (a, b) => b.sec - a.sec,
  )

  const schoolRows: DummySchool[] = (() => {
    if (!school) return DUMMY_SCHOOLS
    const existing = DUMMY_SCHOOLS.find((s) => s.name === school)
    if (existing) {
      const blended = Math.round((existing.avgSec * (existing.memberCount - 1) + myTodaySec) / existing.memberCount)
      return DUMMY_SCHOOLS.map((s) => (s.id === existing.id ? { ...s, avgSec: blended } : s))
    }
    return [...DUMMY_SCHOOLS, { id: 'my-school', name: school, avgSec: myTodaySec, memberCount: 1 }]
  })().sort((a, b) => b.avgSec - a.avgSec)

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <div className="w-full max-w-sm flex items-center justify-between">
        <h1 className="font-cute text-3xl text-ink">랭킹 🏆</h1>
        <button
          type="button"
          onClick={() => setView(view === 'ranking' ? 'history' : 'ranking')}
          className="font-cute text-xs px-3 py-1.5 rounded-full border border-ink/20 text-ink-soft bg-white"
        >
          {view === 'ranking' ? '포인트 내역' : '랭킹으로'}
        </button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="font-cute text-ink-soft text-sm">보유 포인트</span>
        <span className="font-pixel text-ink text-2xl">{balance} P</span>
        <div className="flex items-center gap-1 mt-1">
          <span className="font-cute text-sm text-ink">🔥 {streakCount}일 연속</span>
          {upcoming && (
            <span className="text-ink-soft text-xs font-cute">
              (다음 보너스 {upcoming}일: +{STREAK_MILESTONES[upcoming]}P)
            </span>
          )}
        </div>
      </div>

      {view === 'history' ? (
        <PointHistoryList />
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`font-cute px-3 py-1.5 rounded-full border text-sm ${
                scope === 'all' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setScope('friends')}
              className={`font-cute px-3 py-1.5 rounded-full border text-sm ${
                scope === 'friends' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              친구
            </button>
            <button
              type="button"
              onClick={() => setScope('school')}
              className={`font-cute px-3 py-1.5 rounded-full border text-sm ${
                scope === 'school' ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-ink/20'
              }`}
            >
              학교
            </button>
          </div>

          {scope !== 'school' && (
            <div className="w-full max-w-sm flex flex-col gap-2">
              {sortedPeople.map((entry, idx) => {
                const isMe = entry.id === 'me'
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ${
                      isMe ? 'bg-pastel-yellow' : 'bg-white/70'
                    }`}
                  >
                    <span className="font-pixel text-ink-soft text-sm w-6 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <span className="text-xl">{entry.emoji}</span>
                    <span className="font-cute flex-1 text-ink">{entry.name}</span>
                    <span className="font-pixel text-xs text-ink-soft">{formatDuration(entry.sec)}</span>
                    <span className="font-pixel text-xs text-ink w-14 text-right">
                      {secToPoints(entry.sec)}P
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {scope === 'school' && (
            <div className="w-full max-w-sm flex flex-col gap-3">
              {!school && (
                <div className="flex items-center gap-2 bg-white/70 rounded-2xl px-4 py-3 shadow-sm">
                  <input
                    value={schoolInput}
                    onChange={(e) => setSchoolInput(e.target.value)}
                    placeholder="우리 학교 이름을 입력하세요"
                    className="font-cute flex-1 outline-none text-sm bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSchool(schoolInput)
                      setSchoolInput('')
                    }}
                    className="font-cute px-3 py-1 rounded-full bg-ink text-white text-xs"
                  >
                    등록
                  </button>
                </div>
              )}
              {school && (
                <p className="text-ink-soft text-xs font-cute text-center">
                  내 학교: <span className="text-ink">{school}</span>
                </p>
              )}
              {schoolRows.map((s, idx) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ${
                    s.name === school ? 'bg-pastel-mint' : 'bg-white/70'
                  }`}
                >
                  <span className="font-pixel text-ink-soft text-sm w-6 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </span>
                  <span className="text-xl">🏫</span>
                  <div className="flex-1">
                    <p className="font-cute text-ink text-sm">{s.name}</p>
                    <p className="text-ink-soft text-xs">평균 {formatDuration(s.avgSec)}/인 · {s.memberCount}명</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-ink-soft text-xs font-cute">* 친구/전체/학교 랭킹은 데모용 더미 데이터입니다</p>
        </>
      )}
    </div>
  )
}
