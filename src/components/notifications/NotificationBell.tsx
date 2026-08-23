import { useNotificationStore } from '../../store/notificationStore'

interface NotificationBellProps {
  onClick: () => void
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const unread = useNotificationStore((s) => s.unreadCount())

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative grid h-10 w-10 place-items-center rounded-[15px] border border-white bg-(--color-home-soft-peach) text-base shadow-[0_3px_0_rgba(74,53,84,0.11)] transition-transform active:translate-y-0.5 active:shadow-none"
      aria-label={unread > 0 ? `알림 ${unread}개 열기` : '알림 열기'}
    >
      🔔
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-400 text-white text-[10px] font-pixel flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
