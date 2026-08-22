import { describe, expect, it } from 'vitest'
import { isCaptureThemeLocked, resolveCaptureTheme } from './captureTheme'

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
