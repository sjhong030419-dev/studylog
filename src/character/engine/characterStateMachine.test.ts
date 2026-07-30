import { describe, expect, it } from 'vitest'
import { deriveCharacterState } from './characterStateMachine'

describe('deriveCharacterState priority', () => {
  it('level-up has the highest priority', () => {
    const state = deriveCharacterState({
      isRunning: true,
      isPaused: false,
      isDistracted: true,
      isSleepy: true,
      justCompleted: true,
      justLeveledUp: true,
    })
    expect(state).toBe('levelUp')
  })

  it('completion has priority over away/sleep/study', () => {
    const state = deriveCharacterState({
      isRunning: true,
      isPaused: false,
      isDistracted: true,
      isSleepy: true,
      justCompleted: true,
    })
    expect(state).toBe('happy')
  })

  it('away has priority over sleep/study', () => {
    const state = deriveCharacterState({
      isRunning: true,
      isPaused: false,
      isDistracted: true,
      isSleepy: true,
    })
    expect(state).toBe('away')
  })

  it('sleepy applies while actively studying beyond the threshold', () => {
    const state = deriveCharacterState({
      isRunning: true,
      isPaused: false,
      isDistracted: false,
      isSleepy: true,
    })
    expect(state).toBe('sleep')
  })

  it('running and not paused maps to study', () => {
    const state = deriveCharacterState({ isRunning: true, isPaused: false, isDistracted: false })
    expect(state).toBe('study')
  })

  it('paused maps to break', () => {
    const state = deriveCharacterState({ isRunning: true, isPaused: true, isDistracted: false })
    expect(state).toBe('break')
  })

  it('inactive (not running, not paused) maps to idle', () => {
    const state = deriveCharacterState({ isRunning: false, isPaused: false, isDistracted: false })
    expect(state).toBe('idle')
  })
})
