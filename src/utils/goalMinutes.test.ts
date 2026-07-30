import { describe, expect, it } from 'vitest'
import { parseGoalMinutes } from './goalMinutes'

describe('parseGoalMinutes (onboarding daily goal validation)', () => {
  it('empty input is allowed as "no goal"', () => {
    expect(parseGoalMinutes('')).toEqual({ valid: true, minutes: null })
  })

  it('whitespace-only input is allowed as "no goal"', () => {
    expect(parseGoalMinutes('   ')).toEqual({ valid: true, minutes: null })
  })

  it('allows 1', () => {
    expect(parseGoalMinutes('1')).toEqual({ valid: true, minutes: 1 })
  })

  it('allows 600', () => {
    expect(parseGoalMinutes('600')).toEqual({ valid: true, minutes: 600 })
  })

  it('rejects 0', () => {
    expect(parseGoalMinutes('0').valid).toBe(false)
  })

  it('rejects a negative number', () => {
    expect(parseGoalMinutes('-5').valid).toBe(false)
  })

  it('rejects 601', () => {
    expect(parseGoalMinutes('601').valid).toBe(false)
  })

  it('rejects a decimal', () => {
    expect(parseGoalMinutes('30.5').valid).toBe(false)
  })

  it('rejects a non-numeric value', () => {
    expect(parseGoalMinutes('abc').valid).toBe(false)
  })

  it('rejects Infinity', () => {
    expect(parseGoalMinutes('Infinity').valid).toBe(false)
  })
})
