import { useMemo, useState } from 'react'
import { CharacterView } from '../../character/components/CharacterView'
import { useMyAvatarAppearance } from '../../hooks/useMyAvatarAppearance'
import { useTimerStore } from '../../store/timerStore'
import { usePointsStore } from '../../store/pointsStore'
import { useProfileStore } from '../../store/profileStore'
import { formatDuration } from '../../utils/time'
import { readableInkColor } from '../../utils/contrastColor'
import type { StudySession } from '../../types'
import type { Gender } from '../../character/types'

const BASE_PRESENTATIONS: { value: Gender; label: string }[] = [
  { value: 'boy', label: '남학생 스타일' },
  { value: 'girl', label: '여학생 스타일' },
]

interface MyPageProps {
  onOpenSettings: () => void
}

interface DayLog {
  dateKey: string
  totalSec: number
  bySubject: { subjectId: string; sec: number }[]
}

function formatShortDate(dateKey: string): string {
  const [, m, d] = dateKey.split('-')
  return `${Number(m)}/${Number(d)}`
}

export function MyPage({ onOpenSettings }: MyPageProps) {
  const subjects = useTimerStore((s) => s.subjects)
  const sessions = useTimerStore((s) => s.sessions)

  const balance = usePointsStore((s) => s.balance())
  const streakCount = usePointsStore((s) => s.streakCount)
  const school = usePointsStore((s) => s.school)
  const setSchool = usePointsStore((s) => s.setSchool)

  const nickname = useProfileStore((s) => s.nickname)
  const setNickname = useProfileStore((s) => s.setNickname)
  const gender = useProfileStore((s) => s.gender)
  const setGender = useProfileStore((s) => s.setGender)
  const appearance = useMyAvatarAppearance()

  const [editing, setEditing] = useState(false)
  const [nicknameInput, setNicknameInput] = useState(nickname)
  const [schoolInput, setSchoolInput] = useState(school ?? '')
  const [selectedDay, setSelectedDay] = useState<DayLog | null>(null)
  const [confirmAction, setConfirmAction] = useState<'logout' | 'delete' | null>(null)

  const totalStudySec = sessions.reduce((sum, s) => sum + s.durationSec, 0)

  const recentDays: DayLog[] = useMemo(() => {
    const byDate = new Map<string, StudySession[]>()
    for (const s of sessions) {
      const list = byDate.get(s.dateKey) ?? []
      list.push(s)
      byDate.set(s.dateKey, list)
    }
    return Array.from(byDate.entries())
      .map(([dateKey, list]) => ({
        dateKey,
        totalSec: list.reduce((sum, s) => sum + s.durationSec, 0),
        bySubject: subjects
          .map((subject) => ({
            subjectId: subject.id,
            sec: list.filter((s) => s.subjectId === subject.id).reduce((sum, s) => sum + s.durationSec, 0),
          }))
          .filter((row) => row.sec > 0),
      }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
      .slice(0, 8)
  }, [sessions, subjects])

  function handleSaveProfile() {
    setNickname(nicknameInput)
    setSchool(schoolInput)
    setEditing(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 px-4 py-10">
      <h1 className="font-cute text-3xl text-ink">마이페이지 👤</h1>

      <div
        className="backdrop-blur rounded-3xl shadow-lg px-8 py-6 flex flex-col items-center gap-2 w-full max-w-sm"
        style={{ backgroundColor: appearance.backgroundColor ?? 'rgba(255,255,255,0.7)' }}
      >
        <CharacterView state="happy" gender={gender} appearance={appearance} size={120} />
        <span
          className="font-cute text-lg mt-1"
          style={{ color: readableInkColor(appearance.backgroundColor, 'var(--color-ink)') }}
        >
          {nickname}
        </span>
        <span
          className="text-sm"
          style={{ color: readableInkColor(appearance.backgroundColor, 'var(--color-ink-soft)') }}
        >
          {school ? `🏫 ${school}` : '소속 학교 미등록'}
        </span>

        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setNicknameInput(nickname)
              setSchoolInput(school ?? '')
              setEditing(true)
            }}
            className="font-cute text-xs px-4 py-1.5 rounded-full border border-ink/20 text-ink-soft mt-2"
          >
            프로필 수정
          </button>
        ) : (
          <div className="w-full flex flex-col gap-2 mt-2">
            <input
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="닉네임"
              className="font-cute text-sm px-3 py-2 rounded-xl border border-ink/15 outline-none bg-white"
            />
            <input
              value={schoolInput}
              onChange={(e) => setSchoolInput(e.target.value)}
              placeholder="소속 학교"
              className="font-cute text-sm px-3 py-2 rounded-xl border border-ink/15 outline-none bg-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="font-cute flex-1 px-4 py-1.5 rounded-full border border-ink/20 text-ink-soft text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="font-cute flex-1 px-4 py-1.5 rounded-full bg-pastel-yellow text-ink text-sm"
              >
                저장
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-sm bg-white/70 rounded-2xl shadow-sm px-5 py-4 flex flex-col items-center gap-3">
        <span className="font-cute text-ink-soft text-sm self-start">캐릭터 타입</span>
        <p className="text-ink-soft text-[10px] self-start -mt-1">
          헤어·의상·액세서리는 캐릭터 타입과 상관없이 자유롭게 착용할 수 있어요.
        </p>
        <div className="w-full flex gap-2" role="group" aria-label="캐릭터 타입 선택">
          {BASE_PRESENTATIONS.map((preset) => {
            const selected = gender === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setGender(preset.value)}
                className={`flex-1 font-cute text-sm px-3 py-2.5 rounded-xl border-2 flex items-center justify-center gap-1.5 ${
                  selected ? 'border-ink bg-pastel-yellow text-ink' : 'border-ink/15 bg-white text-ink-soft'
                }`}
              >
                {selected && (
                  <span aria-hidden="true">✓</span>
                )}
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-full max-w-sm grid grid-cols-3 gap-2">
        <div className="bg-white/70 rounded-2xl shadow-sm px-2 py-3 flex flex-col items-center gap-1">
          <span className="text-lg">⏱️</span>
          <span className="font-pixel text-ink text-xs">{formatDuration(totalStudySec)}</span>
          <span className="text-ink-soft text-[10px] font-cute">누적 공부시간</span>
        </div>
        <div className="bg-white/70 rounded-2xl shadow-sm px-2 py-3 flex flex-col items-center gap-1">
          <span className="text-lg">🔥</span>
          <span className="font-pixel text-ink text-xs">{streakCount}일</span>
          <span className="text-ink-soft text-[10px] font-cute">연속 출석</span>
        </div>
        <div className="bg-white/70 rounded-2xl shadow-sm px-2 py-3 flex flex-col items-center gap-1">
          <span className="text-lg">💰</span>
          <span className="font-pixel text-ink text-xs">{balance}P</span>
          <span className="text-ink-soft text-[10px] font-cute">보유 포인트</span>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        <span className="font-cute text-ink-soft text-sm">최근 기록</span>
        {recentDays.length === 0 && (
          <p className="text-ink-soft text-sm text-center font-cute py-6 bg-white/70 rounded-2xl">
            아직 기록이 없어요.
          </p>
        )}
        <div className="grid grid-cols-4 gap-2">
          {recentDays.map((day) => (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => setSelectedDay(day)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-sm"
              style={{ background: 'linear-gradient(160deg, #fdf1ff 0%, #eaf2ff 55%, #eafff5 100%)' }}
            >
              <span className="font-cute text-[10px] text-ink">{formatShortDate(day.dateKey)}</span>
              <span className="font-pixel text-[9px] text-ink-soft">{formatDuration(day.totalSec)}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="font-cute px-6 py-2.5 rounded-full bg-pastel-lavender text-ink shadow text-sm"
      >
        ⚙️ 설정
      </button>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={() => setConfirmAction('logout')}
          className="font-cute text-xs px-4 py-1.5 rounded-full border border-ink/20 text-ink-soft"
        >
          로그아웃
        </button>
        <button
          type="button"
          onClick={() => setConfirmAction('delete')}
          className="font-cute text-xs px-4 py-1.5 rounded-full border border-red-300 text-red-400"
        >
          회원탈퇴
        </button>
      </div>

      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-6"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-xs rounded-3xl p-6 flex flex-col items-center gap-3"
            style={{ background: 'linear-gradient(160deg, #fdf1ff 0%, #eaf2ff 55%, #eafff5 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-cute text-ink text-lg">{formatShortDate(selectedDay.dateKey)} 기록</span>
            <span className="font-pixel text-ink text-2xl">{formatDuration(selectedDay.totalSec)}</span>
            <div className="w-full flex flex-col gap-1.5">
              {selectedDay.bySubject.map((row) => {
                const subject = subjects.find((s) => s.id === row.subjectId)
                return (
                  <div key={row.subjectId} className="flex items-center justify-between text-sm">
                    <span className="font-cute text-ink">{subject?.name ?? row.subjectId}</span>
                    <span className="font-pixel text-ink-soft text-xs">{formatDuration(row.sec)}</span>
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="font-cute text-xs px-4 py-1.5 rounded-full bg-ink text-white mt-1"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-6"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl p-6 flex flex-col items-center gap-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-cute text-ink text-lg">
              {confirmAction === 'logout' ? '로그아웃 하시겠어요?' : '정말 탈퇴하시겠어요?'}
            </span>
            <p className="text-ink-soft text-xs">
              {confirmAction === 'logout'
                ? '데모 버전이라 실제 로그아웃은 아직 연결돼 있지 않아요.'
                : '탈퇴 시 모든 기록이 사라져요. (데모 버전, 실제 삭제는 아직 연결돼 있지 않아요)'}
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="font-cute flex-1 px-4 py-2 rounded-full border border-ink/20 text-ink-soft text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className={`font-cute flex-1 px-4 py-2 rounded-full text-sm text-white ${
                  confirmAction === 'delete' ? 'bg-red-400' : 'bg-ink'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
