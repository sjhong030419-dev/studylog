import { describe, expect, it } from 'vitest'
import { resolveFullSceneName } from './fullSceneState'
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
