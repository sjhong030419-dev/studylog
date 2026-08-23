import type { CaptureTheme } from '../store/settingsStore'

export type EquippedCaptureTheme =
  | 'sakura'
  | 'moonlight'
  | 'rainyCafe'
  | 'autumnBookshop'
  | 'oceanGlasshouse'
  | 'snowyCabin'
  | 'hanokDawn'
  | 'neonArcade'
  | 'celestialAcademy'

const CAPTURE_THEME_BY_SKIN: Readonly<Record<string, EquippedCaptureTheme>> = {
  'skin-sakura-uniform-girl': 'sakura',
  'skin-moonlight-academy': 'moonlight',
  'skin-rainy-study-cafe': 'rainyCafe',
  'skin-autumn-forest-bookshop-v1': 'autumnBookshop',
  'skin-ocean-glasshouse-library-v1': 'oceanGlasshouse',
  'skin-snowy-reading-cabin-v1': 'snowyCabin',
  'skin-hanok-dawn-study-v1': 'hanokDawn',
  'skin-neon-study-arcade-v1': 'neonArcade',
  'skin-celestial-observatory-academy-v1': 'celestialAcademy',
}

export function resolveEquippedCaptureTheme(equippedSkin?: string): EquippedCaptureTheme | undefined {
  return equippedSkin ? CAPTURE_THEME_BY_SKIN[equippedSkin] : undefined
}

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
