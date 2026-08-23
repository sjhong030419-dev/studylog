import { formatDuration } from '../../utils/time'
import { deriveStudyRewardPresentation } from '../../utils/studyRewardPresentation'
import { deriveExpLevel } from '../../character/engine/expLevel'
import { RoomScene } from '../../character/room/RoomScene'
import type { CharacterAppearance, Gender } from '../../character/types'

interface StudyRewardModalProps {
  durationSec: number
  subjectName: string
  todayTotalSec: number
  streakCount: number
  goalPercent: number | null
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
  subjectName,
  todayTotalSec,
  streakCount,
  goalPercent,
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-[radial-gradient(circle_at_50%_8%,#fff0bd_0%,#f3ddeb_34%,#2b2038_100%)] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute left-[10%] top-[10%] animate-bounce text-2xl text-white [animation-delay:120ms] motion-reduce:animate-none">✦</span>
        <span className="absolute right-[11%] top-[16%] animate-bounce text-xl text-pastel-yellow [animation-delay:420ms] motion-reduce:animate-none">★</span>
        <span className="absolute left-[18%] top-[45%] animate-pulse text-xl text-pastel-pink">◆</span>
        <span className="absolute right-[17%] top-[52%] animate-pulse text-2xl text-pastel-lavender">✦</span>
      </div>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-reward-title"
        className="relative mx-auto grid h-full w-full max-w-[430px] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 text-center"
      >
        <header className="flex min-h-[54px] items-center justify-between rounded-[22px] border-2 border-white/90 bg-white/76 px-3 py-2 shadow-[0_5px_0_rgba(59,43,70,0.10)] backdrop-blur-xl">
          <div className="text-left leading-none">
            <p className="font-pixel text-[8px] tracking-[0.16em] text-ink-soft">ADVENTURE CLEAR!</p>
            <h2 id="study-reward-title" className="mt-1.5 font-cute text-xl text-ink">오늘의 모험 완료!</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-[14px] bg-ink/5 font-cute text-lg text-ink" aria-label="결과 화면 닫기">×</button>
        </header>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2">
          <div className="relative mx-auto aspect-[4/5] h-full max-h-full max-w-full overflow-hidden rounded-[28px] border-[4px] border-white shadow-[0_8px_0_rgba(55,39,67,0.16),0_20px_48px_rgba(55,39,67,0.28)]">
            <RoomScene state="happy" gender={gender} appearance={appearance} level={afterLevel.level} animated={false} preferFullScene />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(22,14,31,0.04),transparent_55%,rgba(27,17,38,0.44))]" aria-hidden="true" />
            <div className="absolute left-3 top-3 rounded-[14px] border-2 border-white/75 bg-ink/76 px-3 py-2 text-left text-white shadow-lg backdrop-blur">
              <p className="font-cute text-[8px] tracking-[0.12em] text-white/70">CLEAR SUBJECT</p>
              <p className="mt-1 font-cute text-xs">{subjectName}</p>
            </div>
            {leveledUp && (
              <div className="absolute bottom-3 left-1/2 w-[82%] -translate-x-1/2 rounded-[18px] border-2 border-[#fff4ac] bg-[linear-gradient(135deg,#6751a5,#d56893)] px-4 py-2 text-white shadow-xl">
                <p className="font-pixel text-[9px] text-[#fff4ac]">LEVEL UP!</p>
                <p className="mt-1 font-cute text-sm">LV.{beforeLevel.level} → LV.{afterLevel.level}</p>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border-[3px] border-white bg-[#fffaf2]/95 px-3 py-3 shadow-[0_6px_0_rgba(55,39,67,0.12),0_14px_30px_rgba(55,39,67,0.18)] backdrop-blur">
            <p className="font-cute text-[10px] text-ink-soft">{subjectName} 집중 완료</p>
            <p className="mt-1 font-pixel text-[clamp(1.8rem,9vw,2.6rem)] tracking-[0.06em] text-ink">{formatDuration(durationSec)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ResultStat icon="✨" label="STUDY XP" value={`+${xpGained}`} accent />
              <ResultStat icon="🪙" label="포인트" value={`+${earnedPoints}P`} />
            </div>
            <div className="mt-2 rounded-[16px] border border-ink/5 bg-white/70 px-3 py-2 shadow-inner">
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
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 font-cute text-[9px] text-ink-soft">
              <span>오늘 {formatDuration(todayTotalSec)}</span><span>•</span><span>🔥 {streakCount}일</span>
              {goalPercent !== null && <><span>•</span><span>목표 {Math.min(100, goalPercent)}%</span></>}
            </div>
          </div>
        </div>

        <footer className="rounded-[24px] border-2 border-white/90 bg-white/78 p-2.5 shadow-[0_5px_0_rgba(55,39,67,0.12)] backdrop-blur-xl">
          <div className="grid grid-cols-[1.25fr_0.75fr] gap-2">
            <button
              type="button"
              onClick={onOpenCapture}
              className="min-h-[48px] rounded-[16px] bg-[linear-gradient(135deg,var(--color-home-accent-lavender),var(--color-home-accent-primary))] px-3 py-2 font-cute text-sm text-white shadow-[0_5px_0_rgba(91,57,105,0.22)] transition-transform active:translate-y-0.5 active:shadow-none"
            >
              결과 공유하기 📸
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-[16px] border-2 border-white bg-pastel-yellow px-3 py-2 font-cute text-xs text-ink shadow-[0_5px_0_rgba(91,57,105,0.12)] transition-transform active:translate-y-0.5 active:shadow-none"
            >
              다시 집중 ⚔️
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1">
            <span className="font-cute text-[10px] text-ink-soft">보유 포인트 {balance}P</span>
            <div className="flex items-center gap-1">
              {earnedPoints === 0 && <button type="button" onClick={onOpenQuests} className="min-h-[34px] rounded-xl px-2 font-cute text-[10px] text-ink-soft">퀘스트 보기</button>}
              <button type="button" onClick={onOpenShop} className="min-h-[34px] rounded-xl px-2 font-cute text-[10px] text-ink-soft">{presentation.shopCta} 🎁</button>
            </div>
          </div>
          {earnedPoints === 0 && <p className="mt-1 font-cute text-[9px] text-ink-soft">{presentation.zeroRewardHint}</p>}
        </footer>
      </section>
    </div>
  )
}

function ResultStat({ icon, label, value, accent = false }: { icon: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 rounded-[16px] border-2 border-white px-2 py-2 shadow-[0_3px_0_rgba(84,62,94,0.08)] ${accent ? 'bg-pastel-lavender' : 'bg-white/80'}`}>
      <span className="text-base" aria-hidden="true">{icon}</span>
      <span className="text-left leading-none"><span className="block font-cute text-[8px] text-ink-soft">{label}</span><span className="mt-1 block font-pixel text-[9px] text-ink">{value}</span></span>
    </div>
  )
}
