import { describe, expect, it } from 'vitest'
import { isCaptureThemeLocked, resolveCaptureTheme, resolveEquippedCaptureTheme } from './captureTheme'

describe('capture theme ownership', () => {
  it('keeps the free lavender theme available', () => {
    expect(resolveCaptureTheme('lavender', [])).toBe('lavender')
    expect(isCaptureThemeLocked('lavender', [])).toBe(false)
  })

  it('unlocks rainy cafe only for owners', () => {
    expect(resolveCaptureTheme('rainyCafe', [])).toBe('lavender')
    expect(isCaptureThemeLocked('rainyCafe', [])).toBe(true)
    expect(resolveCaptureTheme('rainyCafe', ['skin-rainy-study-cafe'])).toBe('rainyCafe')
    expect(isCaptureThemeLocked('rainyCafe', ['skin-rainy-study-cafe'])).toBe(false)
  })

  it('unlocks moonlight only for owners', () => {
    expect(resolveCaptureTheme('moonlight', [])).toBe('lavender')
    expect(isCaptureThemeLocked('moonlight', [])).toBe(true)
    expect(resolveCaptureTheme('moonlight', ['skin-moonlight-academy'])).toBe('moonlight')
    expect(isCaptureThemeLocked('moonlight', ['skin-moonlight-academy'])).toBe(false)
  })

  it('does not let owning one seasonal skin unlock another theme', () => {
    expect(resolveCaptureTheme('rainyCafe', ['skin-moonlight-academy'])).toBe('lavender')
    expect(resolveCaptureTheme('moonlight', ['skin-rainy-study-cafe'])).toBe('lavender')
  })
})

describe('equipped skin automatically controls capture presentation', () => {
  it.each([
    ['skin-sakura-uniform-girl', 'sakura'],
    ['skin-moonlight-academy', 'moonlight'],
    ['skin-rainy-study-cafe', 'rainyCafe'],
    ['skin-autumn-forest-bookshop-v1', 'autumnBookshop'],
    ['skin-ocean-glasshouse-library-v1', 'oceanGlasshouse'],
    ['skin-snowy-reading-cabin-v1', 'snowyCabin'],
    ['skin-hanok-dawn-study-v1', 'hanokDawn'],
    ['skin-neon-study-arcade-v1', 'neonArcade'],
    ['skin-celestial-observatory-academy-v1', 'celestialAcademy'],
  ] as const)('maps %s to %s', (skinId, expectedTheme) => {
    expect(resolveEquippedCaptureTheme(skinId)).toBe(expectedTheme)
  })

  it('returns no override when no supported skin is equipped', () => {
    expect(resolveEquippedCaptureTheme()).toBeUndefined()
    expect(resolveEquippedCaptureTheme('unknown-skin')).toBeUndefined()
  })
})
