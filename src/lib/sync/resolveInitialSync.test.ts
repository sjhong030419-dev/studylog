import { describe, expect, it } from 'vitest'
import { resolveInitialSync } from './resolveInitialSync'

describe('resolveInitialSync', () => {
  it('is "unauthenticated" when there is no userId yet, regardless of serverHasRow', () => {
    expect(resolveInitialSync({ userId: null, serverHasRow: true })).toBe('unauthenticated')
    expect(resolveInitialSync({ userId: null, serverHasRow: false })).toBe('unauthenticated')
  })

  it('is "pull" when the server already has a row for this user — server wins', () => {
    expect(resolveInitialSync({ userId: 'user-1', serverHasRow: true })).toBe('pull')
  })

  it('is "push" when the server has no row yet — this device uploads its local data first', () => {
    expect(resolveInitialSync({ userId: 'user-1', serverHasRow: false })).toBe('push')
  })
})
