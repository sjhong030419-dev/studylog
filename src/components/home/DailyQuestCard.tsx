import { deriveDailyQuests } from '../../quests/dailyQuests'
import { useDailyQuestStore } from '../../store/dailyQuestStore'
import { useTimerStore } from '../../store/timerStore'
import { todayKey } from '../../utils/time'

export function DailyQuestCard() {
  const sessions = useTimerStore((state) => state.sessions)
  const claimedDateKey = useDailyQuestStore((state) => state.claimedDateKey)
  const storedClaimedIds = useDailyQuestStore((state) => state.claimedQuestIds)
  const claimQuest = useDailyQuestStore((state) => state.claimQuest)
  const key = todayKey()
  const claimedIds = claimedDateKey === key ? storedClaimedIds : []
  const quests = deriveDailyQuests(sessions, key)
  const completedCount = quests.filter((quest) => quest.complete).length
  const totalReward = quests.reduce((sum, quest) => sum + quest.rewardPoints, 0)
  const overallPercent = Math.round((completedCount / quests.length) * 100)

  return (
    <section
      className="relative w-full overflow-hidden rounded-[28px] border border-white/80 px-4 py-4 shadow-[0_14px_32px_rgba(108,82,130,0.13)]"
      style={{ background: 'linear-gradient(145deg, #fff8e5 0%, #fff0e8 46%, #f2eaff 100%)' }}
      aria-labelledby="daily-quest-title"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/45" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/80 text-2xl shadow-sm" aria-hidden="true">📜</span>
          <div>
            <p className="font-cute text-[10px] tracking-[0.14em] text-ink-soft">DAILY QUEST</p>
            <h2 id="daily-quest-title" className="font-cute text-xl leading-tight text-ink">오늘의 모험</h2>
            <p className="mt-0.5 font-cute text-[10px] text-ink-soft">모두 완료하면 총 {totalReward}P</p>
          </div>
        </div>
        <span className="relative rounded-full border border-white bg-pastel-yellow px-3 py-1.5 font-pixel text-[9px] text-ink shadow-sm">{completedCount}/{quests.length}</span>
      </div>

      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/75 shadow-inner" role="progressbar" aria-label="오늘의 퀘스트 전체 진행률" aria-valuemin={0} aria-valuemax={3} aria-valuenow={completedCount}>
        <div className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${overallPercent}%`, background: 'linear-gradient(90deg, #f4a7b9 0%, #b8a1e6 100%)' }} />
      </div>

      <div className="relative mt-3 flex flex-col gap-2.5">
        {quests.map((quest) => {
          const claimed = claimedIds.includes(quest.id)
          return (
            <div key={quest.id} className={`flex items-center gap-2.5 rounded-[20px] border px-3 py-3 transition-colors ${claimed ? 'border-[#b9dfc8] bg-[#e9f8ee]' : quest.complete ? 'border-[#f1cf7a] bg-[#fff4cc]' : 'border-white/90 bg-white/70'}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl shadow-sm ${claimed ? 'bg-[#d8f1e1]' : 'bg-white'}`} aria-hidden="true">{claimed ? '✓' : quest.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-cute text-[13px] text-ink">{quest.title}</span>
                  <span className="shrink-0 rounded-full bg-pastel-yellow/70 px-2 py-0.5 font-pixel text-[8px] text-ink">+{quest.rewardPoints}P</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8">
                  <div className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${quest.percent}%`, background: claimed ? '#83c99d' : 'linear-gradient(90deg, #f4a7b9 0%, #b8a1e6 100%)' }} />
                </div>
                <span className="mt-1.5 block font-cute text-[10px] text-ink-soft">{claimed ? '보상 수령 완료' : `${quest.current}/${quest.target}${quest.unit} · ${quest.description}`}</span>
              </div>
              <button
                type="button"
                disabled={!quest.complete || claimed}
                onClick={() => claimQuest(quest.id)}
                className={`min-h-[44px] min-w-[56px] shrink-0 rounded-2xl px-2 font-cute text-[10px] transition-transform active:scale-95 ${quest.complete && !claimed ? 'bg-ink text-white shadow-md' : claimed ? 'bg-[#ccebd7] text-[#39734e]' : 'bg-ink/5 text-ink-soft/55'}`}
              >
                {claimed ? '받음' : quest.complete ? '받기' : '진행'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
