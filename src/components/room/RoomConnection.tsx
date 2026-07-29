import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useRoomStore } from '../../store/roomStore'
import { useProfileStore } from '../../store/profileStore'
import { deriveAvatarStatus, useTimerStore } from '../../store/timerStore'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

/**
 * Mounted once at the app root (not inside the room tab) so the realtime
 * connection and presence status survive navigating to other tabs.
 */
export function RoomConnection() {
  const authStatus = useAuthStore((s) => s.status)
  const initAuth = useAuthStore((s) => s.init)

  const nickname = useProfileStore((s) => s.nickname)
  const mySeatIndex = useRoomStore((s) => s.mySeatIndex)
  const join = useRoomStore((s) => s.join)
  const updateMyStatus = useRoomStore((s) => s.updateMyStatus)

  const isRunning = useTimerStore((s) => s.isRunning)
  const isPaused = useTimerStore((s) => s.isPaused)
  const myStatus = deriveAvatarStatus({ isRunning, isPaused })

  useEffect(() => {
    if (!isSupabaseConfigured) return
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (authStatus !== 'ready') return
    join(nickname)
    // No cleanup on unmount — this component lives for the app's lifetime,
    // so the realtime/presence connection stays alive across tab switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus])

  useEffect(() => {
    if (mySeatIndex == null) return
    updateMyStatus(myStatus, nickname)
  }, [myStatus, mySeatIndex, nickname, updateMyStatus])

  return null
}
