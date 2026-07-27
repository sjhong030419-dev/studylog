import { useTimerStore } from '../../store/timerStore'
import { MENTOR_ACCEPTED_ANSWERS_THRESHOLD, useQnaStore } from '../../store/qnaStore'

const BADGE_LABEL: Record<string, string> = {
  none: '',
  mentor: '🌟 멘토',
  top: '👑 베스트 멘토',
}

export function MentorList() {
  const subjects = useTimerStore((s) => s.subjects)
  const mentors = useQnaStore((s) => s.mentors)
  const followedMentorIds = useQnaStore((s) => s.followedMentorIds)
  const toggleFollowMentor = useQnaStore((s) => s.toggleFollowMentor)
  const isMentor = useQnaStore((s) => s.isMentor)
  const myAcceptedAnswerCount = useQnaStore((s) => s.myAcceptedAnswerCount())
  const applyForMentor = useQnaStore((s) => s.applyForMentor)

  const progress = Math.min(1, myAcceptedAnswerCount / MENTOR_ACCEPTED_ANSWERS_THRESHOLD)

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      <div className="bg-white/80 rounded-2xl shadow px-5 py-4 flex flex-col gap-2">
        <span className="font-cute text-ink">멘토 신청</span>
        {isMentor ? (
          <p className="text-ink text-sm font-cute">🌟 이미 멘토로 활동 중이에요!</p>
        ) : (
          <>
            <p className="text-ink-soft text-xs font-cute">
              채택된 답변 {myAcceptedAnswerCount} / {MENTOR_ACCEPTED_ANSWERS_THRESHOLD}개
            </p>
            <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-pastel-yellow"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={applyForMentor}
              disabled={myAcceptedAnswerCount < MENTOR_ACCEPTED_ANSWERS_THRESHOLD}
              className="font-cute self-start px-4 py-1.5 rounded-full bg-pastel-lavender text-ink text-xs disabled:opacity-50"
            >
              멘토 신청하기
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {mentors.map((m) => {
          const subjectNames = m.subjectIds
            .map((id) => subjects.find((s) => s.id === id)?.name)
            .filter(Boolean)
            .join(', ')
          const isFollowed = followedMentorIds.includes(m.id)
          return (
            <div key={m.id} className="bg-white/70 rounded-2xl px-4 py-3 shadow-sm flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-cute text-ink text-sm">{m.name}</span>
                <span className="text-xs font-cute">{BADGE_LABEL[m.badge]}</span>
              </div>
              <p className="text-ink-soft text-xs">{subjectNames} 담당</p>
              <p className="text-ink text-xs">{m.bio}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-ink-soft text-[10px] font-pixel">
                  채택 {m.acceptedAnswerCount} · 팔로워 {m.followerCount}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFollowMentor(m.id)}
                  className={`font-cute text-xs px-3 py-1 rounded-full border ${
                    isFollowed ? 'bg-ink text-white border-ink' : 'border-ink/20 text-ink-soft'
                  }`}
                >
                  {isFollowed ? '팔로잉' : '팔로우'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
