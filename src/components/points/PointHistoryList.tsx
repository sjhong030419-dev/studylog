import { usePointsStore } from '../../store/pointsStore'

const TYPE_ICON: Record<string, string> = {
  earn_study: '⏱️',
  earn_streak: '🔥',
  earn_other: '🎁',
  spend: '🛍️',
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

export function PointHistoryList() {
  const transactions = usePointsStore((s) => s.transactions)
  const sorted = [...transactions].sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="w-full max-w-sm flex flex-col gap-2">
      {sorted.length === 0 && (
        <p className="text-ink-soft text-sm text-center font-cute py-4">
          아직 포인트 내역이 없어요.
        </p>
      )}
      {sorted.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white/70 shadow-sm"
        >
          <span className="text-xl">{TYPE_ICON[t.type]}</span>
          <div className="flex-1">
            <p className="font-cute text-ink text-sm">{t.reason}</p>
            <p className="text-ink-soft text-xs">{formatTimestamp(t.timestamp)}</p>
          </div>
          <span
            className={`font-pixel text-sm ${t.type === 'spend' ? 'text-red-400' : 'text-ink'}`}
          >
            {t.type === 'spend' ? '-' : '+'}
            {t.amount}P
          </span>
        </div>
      ))}
    </div>
  )
}
