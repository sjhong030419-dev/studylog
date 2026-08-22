import { useToastStore } from '../../store/toastStore'

/** Single mount point for every "reward received" confirmation in the app
 * (daily quest claim, season reward claim, season skin claim, shop
 * purchase, equip/unequip) — see toastStore.ts. Deliberately just one
 * fixed-position stack, not a routing/queueing system: `App.tsx` mounts
 * this once, and any screen pushes into the same shared store. */
export function RewardToastHost() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  if (toasts.length === 0) return null

  return (
    <div
      // top-20 (80px), not top-3: the profile/notification icons are fixed
      // at top-3 with a 44px tap target (App.tsx/NotificationBell.tsx,
      // ending around 56px down) — a centered toast spanning most of a
      // narrow viewport's width would otherwise sit on top of and hide
      // them (confirmed by measuring both at 320px width). The 80px (not
      // just 64px) leaves headroom for the toast-in entrance animation's
      // -12px translateY, so even its very first frame — the moment it's
      // furthest from its resting position — still clears the icons.
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="animate-toast-in pointer-events-auto flex w-full max-w-xs items-center gap-2.5 rounded-full border border-white/80 bg-white/95 px-4 py-2.5 shadow-[0_10px_30px_rgba(83,63,96,0.22)] backdrop-blur dark:bg-[#2d2842]/95"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pastel-yellow text-lg" aria-hidden="true">
            {toast.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-cute text-[13px] text-ink">{toast.title}</p>
            {toast.subtitle && <p className="truncate font-cute text-[10px] text-ink-soft">{toast.subtitle}</p>}
          </div>
          {typeof toast.points === 'number' && toast.points > 0 && (
            <span className="shrink-0 rounded-full bg-pastel-mint px-2.5 py-1 font-pixel text-[10px] text-ink">
              +{toast.points}P
            </span>
          )}
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="grid h-11 w-11 shrink-0 -mr-2 place-items-center rounded-full text-ink-soft/70"
            aria-label="알림 닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
