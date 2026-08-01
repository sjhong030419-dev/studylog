import { describe, expect, it, vi, afterEach } from 'vitest'
import { reportSyncError } from './syncHelpers'

describe('reportSyncError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns to the console when given a real error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportSyncError('profiles:upsert', new Error('network down'))
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('profiles:upsert')
  })

  it('does nothing for a falsy error (success case)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportSyncError('profiles:upsert', null)
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
