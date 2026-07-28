import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useAwayStore } from '../store/awayStore'
import { todayKey } from '../utils/time'

const THRESHOLD_SEC = 5

interface UseAwayDetectionOptions {
  active: boolean
  onHide: () => void
  onShortReturn: () => void
  onLongReturn: (awaySec: number) => void
}

export function useAwayDetection({ active, onHide, onShortReturn, onLongReturn }: UseAwayDetectionOptions) {
  const enabled = useSettingsStore((s) => s.awayDetectionEnabled)
  const logAway = useAwayStore((s) => s.logAway)

  const activeRef = useRef(active)
  activeRef.current = active
  const hiddenAtRef = useRef<number | null>(null)

  const onHideRef = useRef(onHide)
  onHideRef.current = onHide
  const onShortReturnRef = useRef(onShortReturn)
  onShortReturnRef.current = onShortReturn
  const onLongReturnRef = useRef(onLongReturn)
  onLongReturnRef.current = onLongReturn

  useEffect(() => {
    if (!enabled) return

    function handleVisibility() {
      if (document.hidden) {
        if (activeRef.current) {
          hiddenAtRef.current = Date.now()
          onHideRef.current()
        }
      } else if (hiddenAtRef.current != null) {
        const awaySec = Math.round((Date.now() - hiddenAtRef.current) / 1000)
        hiddenAtRef.current = null
        if (awaySec < THRESHOLD_SEC) {
          onShortReturnRef.current()
        } else {
          logAway(todayKey(), awaySec)
          onLongReturnRef.current(awaySec)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, logAway])
}
