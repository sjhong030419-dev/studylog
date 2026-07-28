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
      className="fixed top-3 right-3 z-30 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-lg"
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
