import { formatDuration } from '../../utils/time'
import { deriveStudyRewardPresentation } from '../../utils/studyRewardPresentation'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { RoomScene } from '../../character/room/RoomScene'
import type { CharacterAppearance, Gender } from '../../character/types'

interface StudyRewardModalProps {
  durationSec: number
  earnedPoints: number
  balance: number
  studyXpBefore: number
  studyXpAfter: number
  gender: Gender
  appearance: Partial<CharacterAppearance>
  onClose: () => void
  onOpenQuests: () => void
  onOpenCapture: () => void
  onOpenShop: () => void
}

export function StudyRewardModal({
  durationSec,
  earnedPoints,
  balance,
  studyXpBefore,
  studyXpAfter,
  gender,
  appearance,
  onClose,
  onOpenQuests,
  onOpenCapture,
  onOpenShop,
}: StudyRewardModalProps) {
  const presentation = deriveStudyRewardPresentation(earnedPoints)
  const beforeLevel = deriveExpLevel(studyXpBefore)
  const afterLevel = deriveExpLevel(studyXpAfter)
  const xpGained = Math.max(0, studyXpAfter - studyXpBefore)
  const leveledUp = afterLevel.level > beforeLevel.level
  const progressPercent = Math.round(afterLevel.progressRatio * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-[#241c31]/72 px-3 pb-3 pt-10 backdrop-blur-md sm:items-center sm:pb-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute left-[12%] top-[12%] animate-bounce text-2xl [animation-delay:120ms]">✦</span>
        <span className="absolute right-[13%] top-[18%] animate-bounce text-xl text-pastel-yellow [animation-delay:420ms]">★</span>
        <span className="absolute left-[18%] top-[45%] animate-pulse text-xl text-pastel-pink">◆</span>
        <span className="absolute right-[17%] top-[52%] animate-pulse text-2xl text-pastel-lavender">✦</span>
      </div>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-reward-title"
        className="relative w-full max-w-sm overflow-hidden rounded-[32px] border-[4px] border-white bg-[#fffaf2] text-center shadow-[0_10px_0_rgba(38,27,48,0.28),0_30px_70px_rgba(18,10,27,0.45)]"
      >
        <div className="relative h-[210px] overflow-hidden border-b-[4px] border-white bg-pastel-lavender">
          <RoomScene
            state="happy"
            gender={gender}
            appearance={appearance}
            level={afterLevel.level}
            animated={false}
            preferFullScene
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(22,14,31,0.06),transparent_42%,rgba(27,17,38,0.5))]" aria-hidden="true" />
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full border-2 border-white/80 bg-ink/78 px-4 py-2 font-cute text-[10px] tracking-[0.16em] text-white shadow-lg backdrop-blur">
            ADVENTURE CLEAR!
          </div>
          {leveledUp && (
            <div className="absolute bottom-3 left-1/2 w-[82%] -translate-x-1/2 rounded-2xl border-2 border-[#fff4ac] bg-[linear-gradient(135deg,#6751a5,#d56893)] px-4 py-2 text-white shadow-xl">
              <p className="font-pixel text-[10px] text-[#fff4ac]">LEVEL UP!</p>
              <p className="mt-1 font-cute text-base">LV.{beforeLevel.level} → LV.{afterLevel.level}</p>
            </div>
          )}
        </div>
        <div className="px-4 pb-5 pt-4">
          <p className="font-cute text-[10px] tracking-[0.12em] text-ink-soft">오늘의 집중 모험 완료</p>
          <h2 id="study-reward-title" className="mt-1 font-cute text-2xl text-ink">
            멋진 집중이었어요!
          </h2>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <ResultStat icon="⏱" label="집중 시간" value={formatDuration(durationSec)} />
            <ResultStat icon="✨" label="Study XP" value={`+${xpGained}`} accent />
            <ResultStat icon="🪙" label="획득 포인트" value={`+${earnedPoints}P`} />
          </div>

          <div className="mt-3 rounded-[20px] border border-ink/5 bg-white/75 px-3 py-3 shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <span className="font-cute text-xs text-ink">LV.{afterLevel.level} 성장</span>
              <span className="font-pixel text-[8px] text-ink-soft">{afterLevel.expIntoLevel}/{afterLevel.expForNextLevel} XP</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10 p-[2px]">
              <div
                className="relative h-full rounded-full bg-[linear-gradient(90deg,#9276d5,#ef7fa4)] transition-[width] duration-1000 after:absolute after:inset-x-1 after:top-[1px] after:h-[2px] after:rounded-full after:bg-white/70 motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {earnedPoints === 0 && (
              <p className="mt-2 font-cute text-[10px] leading-relaxed text-ink-soft">{presentation.zeroRewardHint}</p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={onOpenCapture}
              className="min-h-[50px] rounded-2xl bg-[linear-gradient(135deg,var(--color-home-accent-lavender),var(--color-home-accent-primary))] px-4 py-3 font-cute text-sm text-white shadow-[0_5px_0_rgba(91,57,105,0.22)] transition-transform active:translate-y-0.5 active:shadow-none"
            >
              결과 카드 만들기 📸
            </button>
            <button
              type="button"
              onClick={onOpenShop}
              className="grid min-h-[50px] min-w-[54px] place-items-center rounded-2xl border-2 border-white bg-pastel-yellow text-xl shadow-[0_5px_0_rgba(91,57,105,0.12)] transition-transform active:translate-y-0.5 active:shadow-none"
              aria-label={presentation.shopCta}
            >
              🎁
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="font-cute text-[10px] text-ink-soft">보유 포인트 {balance}P</span>
            <button
              type="button"
              onClick={earnedPoints > 0 ? onClose : onOpenQuests}
              className="min-h-[40px] rounded-xl px-3 font-cute text-[11px] text-ink-soft"
            >
              {presentation.closeCta} →
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function ResultStat({ icon, label, value, accent = false }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-[18px] border-2 border-white px-2 py-3 shadow-[0_4px_0_rgba(84,62,94,0.08)] ${accent ? 'bg-pastel-lavender' : 'bg-white/80'}`}>
      <span className="text-lg" aria-hidden="true">{icon}</span>
      <span className="mt-1 block font-cute text-[9px] text-ink-soft">{label}</span>
      <span className="mt-1 block font-pixel text-[9px] text-ink">{value}</span>
    </div>
  )
}
