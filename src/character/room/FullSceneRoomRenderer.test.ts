import { describe, expect, it } from 'vitest'
import { resolveFullSceneName, shouldUseFullScene } from './fullSceneState'
import type { CharacterState } from '../types'

describe('resolveFullSceneName', () => {
  it.each<CharacterState>(['study', 'reading', 'typing', 'focused'])(
    'maps active study state %s to the study scene',
    (state) => expect(resolveFullSceneName(state)).toBe('study'),
  )

  it.each<CharacterState>(['happy', 'excited', 'celebrate', 'levelUp'])(
    'maps reward state %s to the happy scene',
    (state) => expect(resolveFullSceneName(state)).toBe('happy'),
  )

  it('uses the dedicated sleep scene', () => {
    expect(resolveFullSceneName('sleep')).toBe('sleep')
  })

  it.each<CharacterState>(['idle', 'thinking', 'break', 'away'])(
    'maps neutral state %s to the idle scene',
    (state) => expect(resolveFullSceneName(state)).toBe('idle'),
  )
})

describe('shouldUseFullScene (scoping — fixes: RoomScene used to always try FullSceneRoomRenderer first, overriding LogCaptureCard\'s appearance/level/animated)', () => {
  it('is false by default (preferFullScene not opted in) — LogCaptureCard\'s share card behavior', () => {
    expect(shouldUseFullScene({ preferFullScene: false, fullSceneLoadFailed: false })).toBe(false)
  })

  it('is true once a caller opts in and nothing has failed — CharacterRoomCard\'s timer screen behavior', () => {
    expect(shouldUseFullScene({ preferFullScene: true, fullSceneLoadFailed: false })).toBe(true)
  })

  it('falls back once the scene image has failed to load, even for an opted-in caller', () => {
    expect(shouldUseFullScene({ preferFullScene: true, fullSceneLoadFailed: true })).toBe(false)
  })

  it('stays false for a non-opted-in caller regardless of load-failure state', () => {
    expect(shouldUseFullScene({ preferFullScene: false, fullSceneLoadFailed: true })).toBe(false)
  })
})
