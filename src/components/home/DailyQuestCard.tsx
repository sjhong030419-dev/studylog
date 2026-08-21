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

  return (
    <section className="w-full rounded-[24px] border border-white/80 bg-white/72 px-4 py-4 shadow-[0_10px_28px_rgba(108,82,130,0.09)]" aria-labelledby="daily-quest-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-cute text-[10px] tracking-wide text-ink-soft">DAILY QUEST</p>
          <h2 id="daily-quest-title" className="font-cute text-lg text-ink">오늘의 퀘스트 ✨</h2>
        </div>
        <span className="rounded-full bg-pastel-yellow px-3 py-1 font-pixel text-[9px] text-ink">{completedCount}/{quests.length}</span>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {quests.map((quest) => {
          const claimed = claimedIds.includes(quest.id)
          return (
            <div key={quest.id} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${quest.complete ? 'border-pastel-yellow bg-pastel-yellow/30' : 'border-ink/8 bg-white/60'}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm" aria-hidden="true">{claimed ? '✅' : quest.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-cute text-xs text-ink">{quest.title}</span>
                  <span className="shrink-0 font-pixel text-[8px] text-ink-soft">+{quest.rewardPoints}P</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                  <div className="h-full rounded-full bg-(--color-home-accent-primary) transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${quest.percent}%` }} />
                </div>
                <span className="mt-1 block font-cute text-[9px] text-ink-soft">{quest.current}/{quest.target}{quest.unit} · {quest.description}</span>
              </div>
              <button
                type="button"
                disabled={!quest.complete || claimed}
                onClick={() => claimQuest(quest.id)}
                className={`min-h-[40px] min-w-[54px] shrink-0 rounded-full px-2 font-cute text-[9px] ${quest.complete && !claimed ? 'bg-ink text-white shadow-sm' : 'bg-ink/5 text-ink-soft/60'}`}
              >
                {claimed ? '완료' : quest.complete ? '받기' : '진행중'}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
