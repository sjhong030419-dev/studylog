import { useNotificationStore } from '../../store/notificationStore'
import type { NavTarget, NotificationType } from '../../types'

interface NotificationsPageProps {
  onBack: () => void
  onNavigate: (target: NavTarget) => void
}

const TYPE_ICON: Record<NotificationType, string> = {
  rank_overtaken: '🏃',
  streak_warning: '🔥',
  answer_accepted: '✅',
  mentor_result: '🌟',
  event: '📣',
}

function timeAgo(ts: number): string {
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`
  return `${Math.floor(diffHour / 24)}일 전`
}

export function NotificationsPage({ onBack, onNavigate }: NotificationsPageProps) {
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  const sorted = [...notifications].sort((a, b) => b.createdAt - a.createdAt)

  function handleClick(id: string, read: boolean, linkTarget?: NavTarget) {
    if (!read) markRead(id)
    if (linkTarget) onNavigate(linkTarget)
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-4 px-4 py-10">
      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="font-cute text-ink-soft text-sm">
            ← 뒤로
          </button>
          <h1 className="font-cute text-2xl text-ink">알림 🔔</h1>
        </div>
        <button type="button" onClick={markAllRead} className="font-cute text-xs text-ink-soft">
          모두 읽음
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="text-ink-soft text-sm text-center font-cute py-8">알림이 없어요.</p>
        )}
        {sorted.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleClick(n.id, n.read, n.linkTarget)}
            className={`text-left rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3 ${
              n.read ? 'bg-white/60' : 'bg-white/90'
            }`}
          >
            <span className="text-xl">{TYPE_ICON[n.type]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-cute text-ink text-sm">{n.title}</span>
                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
              </div>
              <p className="text-ink-soft text-xs mt-0.5">{n.body}</p>
              <p className="text-ink-soft text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
