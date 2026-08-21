import { MOONLIGHT_REWARDS, canClaimMoonlightReward, moonlightSeasonProgress } from '../../season/moonlightSeason'
import { usePointsStore } from '../../store/pointsStore'
import { useSeasonStore } from '../../store/seasonStore'

export function MoonlightSeasonCard() {
  const studyXp = usePointsStore((state) => state.studyXpTotal())
  const claimedRewardIds = useSeasonStore((state) => state.claimedRewardIds)
  const claimReward = useSeasonStore((state) => state.claimMoonlightReward)
  const progress = moonlightSeasonProgress(studyXp)

  return (
    <section
      className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white/20 px-5 py-5 text-[#fff8e8] shadow-[0_18px_40px_rgba(27,25,58,0.24)]"
      style={{ background: 'linear-gradient(145deg, #171b35 0%, #29274b 52%, #6a4f72 100%)' }}
      aria-labelledby="moonlight-season-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-cute text-[10px] tracking-[0.18em] text-[#d9c4ff]">SEASON 1</p>
          <h2 id="moonlight-season-title" className="mt-0.5 font-cute text-xl">달빛 도서관의 초대 🌙</h2>
          <p className="mt-1 font-cute text-[10px] leading-relaxed text-[#eee5ff]">
            공부 XP를 모아 별빛 보상과 한정 스킨을 받아보세요.
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl shadow-inner" aria-hidden="true">🏰</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between font-pixel text-[9px] text-[#ffe2a3]">
          <span>{progress.currentXp} XP</span>
          <span>{progress.targetXp} XP</span>
        </div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-black/25 p-[2px]" role="progressbar" aria-valuemin={0} aria-valuemax={progress.targetXp} aria-valuenow={progress.currentXp} aria-label="달빛 시즌 진행도">
          <div
            className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${progress.percent}%`, background: 'linear-gradient(90deg, #d9c4ff 0%, #ffe2a3 100%)' }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {MOONLIGHT_REWARDS.map((reward) => {
          const claimed = claimedRewardIds.includes(reward.id)
          const claimable = canClaimMoonlightReward(reward, studyXp, claimedRewardIds)
          const reached = studyXp >= reward.requiredXp
          return (
            <div key={reward.id} className={`flex min-h-[116px] flex-col items-center rounded-2xl border px-2 py-3 text-center ${reached ? 'border-[#ffe2a3]/50 bg-white/12' : 'border-white/10 bg-black/10'}`}>
              <span className={`text-2xl ${reached ? '' : 'grayscale opacity-50'}`} aria-hidden="true">{claimed ? '✓' : reward.emoji}</span>
              <span className="mt-1 font-pixel text-[8px] text-[#ffe2a3]">{reward.requiredXp} XP</span>
              <span className="mt-1 flex-1 font-cute text-[9px] leading-snug text-[#fff8e8]">{reward.label}</span>
              <button
                type="button"
                disabled={!claimable}
                onClick={() => claimReward(reward.id)}
                className={`mt-2 min-h-[32px] w-full rounded-full px-2 font-cute text-[9px] ${claimable ? 'bg-[#ffe2a3] text-[#252b50] shadow' : 'bg-white/10 text-white/55'}`}
              >
                {claimed ? '수령 완료' : claimable ? '받기' : '잠김'}
              </button>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center font-cute text-[9px] text-[#d9c4ff]">실제 공부 XP만 인정 · 스킨 보유자는 완료 시 80P 지급</p>
    </section>
  )
}
