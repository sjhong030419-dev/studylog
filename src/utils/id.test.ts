import { describe, expect, it } from 'vitest'
import { generateId } from './id'

describe('generateId', () => {
  it('prefixes the id', () => {
    expect(generateId('subject')).toMatch(/^subject-/)
  })

  it('generates unique ids across repeated calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('subject')))
    expect(ids.size).toBe(50)
  })
})
