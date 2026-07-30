import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useRoomStore } from '../../store/roomStore'
import { useProfileStore } from '../../store/profileStore'
import { useTimerStore } from '../../store/timerStore'
import { deriveCharacterState } from '../../character/engine/characterStateMachine'
import { isSupabaseConfigured } from '../../lib/supabaseClient'

/**
 * Mounted once at the app root (not inside the room tab) so the realtime
 * connection and presence status survive navigating to other tabs.
 */
export function RoomConnection() {
  const authStatus = useAuthStore((s) => s.status)
  const initAuth = useAuthStore((s) => s.init)

  const nickname = useProfileStore((s) => s.nickname)
  const gender = useProfileStore((s) => s.gender)
  const mySeatIndex = useRoomStore((s) => s.mySeatIndex)
  const join = useRoomStore((s) => s.join)
  const updateMyStatus = useRoomStore((s) => s.updateMyStatus)

  const isRunning = useTimerStore((s) => s.isRunning)
  const isPaused = useTimerStore((s) => s.isPaused)
  // RoomConnection only ever had isRunning/isPaused (away-detection lives
  // locally inside StudyTimer, not in a shared store), so this can only
  // resolve to idle/study/break — the same real signals it always had.
  const myStatus = deriveCharacterState({ isRunning, isPaused, isDistracted: false })

  useEffect(() => {
    if (!isSupabaseConfigured) return
    initAuth()
  }, [initAuth])

  useEffect(() => {
    if (authStatus !== 'ready') return
    join(nickname, gender)
    // No cleanup on unmount — this component lives for the app's lifetime,
    // so the realtime/presence connection stays alive across tab switches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus])

  useEffect(() => {
    if (mySeatIndex == null) return
    updateMyStatus(myStatus, nickname, gender)
  }, [myStatus, mySeatIndex, nickname, gender, updateMyStatus])

  return null
}
