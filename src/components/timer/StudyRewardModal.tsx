import { formatDuration } from '../../utils/time'

interface StudyRewardModalProps {
  durationSec: number
  earnedPoints: number
  balance: number
  onClose: () => void
  onOpenShop: () => void
}

export function StudyRewardModal({
  durationSec,
  earnedPoints,
  balance,
  onClose,
  onOpenShop,
}: StudyRewardModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 px-4 pb-5 pt-16 backdrop-blur-sm sm:items-center sm:pb-16">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-reward-title"
        className="w-full max-w-sm rounded-[28px] border border-white/70 bg-[#fffaf2] px-5 py-6 text-center shadow-2xl"
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-pastel-yellow text-4xl shadow-sm">
          {earnedPoints > 0 ? '🎁' : '📖'}
        </div>
        <p className="font-cute text-xs text-ink-soft">오늘의 공부 완료</p>
        <h2 id="study-reward-title" className="mt-1 font-cute text-2xl text-ink">
          {formatDuration(durationSec)} 집중했어요!
        </h2>

        <div className="my-5 rounded-2xl bg-white/80 px-4 py-4 shadow-sm">
          {earnedPoints > 0 ? (
            <>
              <p className="font-cute text-xs text-ink-soft">이번에 받은 보상</p>
              <p className="mt-1 font-pixel text-3xl text-ink">+{earnedPoints}P</p>
            </>
          ) : (
            <>
              <p className="font-cute text-sm text-ink">기록이 소중하게 저장됐어요.</p>
              <p className="mt-1 font-cute text-xs text-ink-soft">10분마다 1P를 받을 수 있어요!</p>
            </>
          )}
          <p className="mt-2 font-cute text-[11px] text-ink-soft">현재 보유 {balance}P</p>
        </div>

        <button
          type="button"
          onClick={onOpenShop}
          className="w-full rounded-2xl bg-ink px-4 py-3 font-cute text-sm text-white shadow-sm"
        >
          상점과 내 옷장 보기
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-2xl px-4 py-2.5 font-cute text-xs text-ink-soft"
        >
          계속하기
        </button>
      </section>
    </div>
  )
}
