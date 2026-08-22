import type { CaptureTheme } from '../store/settingsStore'

export function resolveCaptureTheme(
  requested: CaptureTheme,
  ownedItemIds: readonly string[],
): CaptureTheme {
  if (requested === 'rainyCafe' && ownedItemIds.includes('skin-rainy-study-cafe')) return 'rainyCafe'
  if (requested === 'moonlight' && ownedItemIds.includes('skin-moonlight-academy')) return 'moonlight'
  return 'lavender'
}

export function isCaptureThemeLocked(theme: CaptureTheme, ownedItemIds: readonly string[]): boolean {
  if (theme === 'rainyCafe') return !ownedItemIds.includes('skin-rainy-study-cafe')
  if (theme === 'moonlight') return !ownedItemIds.includes('skin-moonlight-academy')
  return false
}
