import { describe, expect, it } from 'vitest'
import {
  resolveFullSceneName,
  resolveFullScenePath,
  resolveFullSceneSwap,
  resolveFullSceneTheme,
  resolveEquippedFullSceneTheme,
  shouldUseFullScene,
} from './fullSceneState'
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

describe('resolveFullSceneTheme', () => {
  it('uses the default room when no complete appearance variant is equipped', () => {
    expect(resolveFullSceneTheme()).toBe('default-night')
  })

  it('uses the matching room family for the sakura uniform skin', () => {
    expect(resolveFullSceneTheme('skin-sakura-uniform-girl')).toBe('sakura-uniform')
    expect(resolveFullScenePath('sakura-uniform', 'boy', 'study')).toBe(
      '/sprites/room/sakura-uniform/scenes/boy/study.webp',
    )
  })

  it('uses the fully baked ribbon room when the sakura+ribbon variant wins', () => {
    expect(resolveFullSceneTheme('skin-sakura-uniform-ribbon')).toBe('sakura-uniform-ribbon')
    expect(resolveFullScenePath('sakura-uniform-ribbon', 'girl', 'sleep')).toBe(
      '/sprites/room/sakura-uniform-ribbon/scenes/girl/sleep.webp',
    )
  })

  it('uses the Moonlight Academy room for its complete seasonal skin', () => {
    expect(resolveFullSceneTheme('skin-moonlight-academy')).toBe('moonlight-academy')
    expect(resolveFullScenePath('moonlight-academy', 'girl', 'happy')).toBe(
      '/sprites/room/moonlight-academy/scenes/girl/happy.webp',
    )
  })

  it('uses the Rainy Study Cafe room for both genders', () => {
    expect(resolveFullSceneTheme('skin-rainy-study-cafe')).toBe('rainy-study-cafe')
    expect(resolveFullScenePath('rainy-study-cafe', 'boy', 'study')).toBe(
      '/sprites/room/rainy-study-cafe/scenes/boy/study.webp',
    )
  })

  it('keeps unsupported appearance variants on the live avatar renderer', () => {
    expect(resolveFullSceneTheme('hair-color-black')).toBeUndefined()
  })

  it('resolves every new full-scene shop skin directly from equipped item ids', () => {
    expect(resolveEquippedFullSceneTheme(['skin-autumn-forest-bookshop-v1'])).toBe('autumn-forest-bookshop-v1')
    expect(resolveEquippedFullSceneTheme(['skin-ocean-glasshouse-library-v1'])).toBe('ocean-glasshouse-library-v1')
    expect(resolveEquippedFullSceneTheme(['skin-snowy-reading-cabin-v1'])).toBe('snowy-reading-cabin-v1')
    expect(resolveEquippedFullSceneTheme(['skin-hanok-dawn-study-v1'])).toBe('hanok-dawn-study-v1')
    expect(resolveEquippedFullSceneTheme(['skin-neon-study-arcade-v1'])).toBe('neon-study-arcade-v1')
    expect(resolveEquippedFullSceneTheme(['skin-celestial-observatory-academy-v1'])).toBe('celestial-observatory-academy-v1')
  })
})

describe('shouldUseFullScene (scoping — fixes: RoomScene used to always try FullSceneRoomRenderer first, overriding LogCaptureCard\'s appearance/level/animated)', () => {
  it('is false by default (preferFullScene not opted in) — LogCaptureCard\'s share card behavior', () => {
    expect(
      shouldUseFullScene({
        preferFullScene: false,
        fullSceneLoadFailed: false,
        hasRenderableAppearanceVariant: false,
      }),
    ).toBe(false)
  })

  it('is true once a caller opts in and nothing has failed — CharacterRoomCard\'s timer screen behavior', () => {
    expect(
      shouldUseFullScene({
        preferFullScene: true,
        fullSceneLoadFailed: false,
        hasRenderableAppearanceVariant: false,
      }),
    ).toBe(true)
  })

  it('falls back once the scene image has failed to load, even for an opted-in caller', () => {
    expect(
      shouldUseFullScene({
        preferFullScene: true,
        fullSceneLoadFailed: true,
        hasRenderableAppearanceVariant: false,
      }),
    ).toBe(false)
  })

  it('stays false for a non-opted-in caller regardless of load-failure state', () => {
    expect(
      shouldUseFullScene({
        preferFullScene: false,
        fullSceneLoadFailed: true,
        hasRenderableAppearanceVariant: false,
      }),
    ).toBe(false)
  })

  it('skips baked full-scene art when an equipped whole-avatar variant must remain visible', () => {
    expect(
      shouldUseFullScene({
        preferFullScene: true,
        fullSceneLoadFailed: false,
        hasRenderableAppearanceVariant: true,
      }),
    ).toBe(false)
  })
})

describe('resolveFullSceneSwap (fixes: an ancestor re-render with no real gender/state change used to restart an in-flight image load)', () => {
  const BOY_IDLE = '/sprites/room/default-night/scenes/boy/idle.webp'
  const BOY_STUDY = '/sprites/room/default-night/scenes/boy/study.webp'

  it('is a no-op when the target is already the current display target', () => {
    // This is the exact case StudyTimer's once-a-second re-render used to
    // break: gender/state haven't changed, so currentTarget === nextTarget,
    // and nothing should restart — regardless of why the effect re-ran.
    expect(resolveFullSceneSwap(BOY_IDLE, BOY_IDLE, false)).toEqual({ kind: 'unchanged' })
    expect(resolveFullSceneSwap(BOY_IDLE, BOY_IDLE, true)).toEqual({ kind: 'unchanged' })
  })

  it('swaps immediately when the new target is already preloaded', () => {
    expect(resolveFullSceneSwap(BOY_IDLE, BOY_STUDY, true)).toEqual({ kind: 'swap-immediately' })
  })

  it('requires a background load when the new target has not been preloaded yet', () => {
    expect(resolveFullSceneSwap(BOY_IDLE, BOY_STUDY, false)).toEqual({ kind: 'load-then-swap' })
  })
})
