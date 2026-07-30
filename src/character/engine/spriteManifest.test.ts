import { describe, expect, it } from 'vitest'
import {
  LAYER_TO_FOLDER,
  resolveBaseFramePath,
  resolveCosmeticFramePath,
  resolveEffectFramePath,
  resolveFaceFramePath,
  SLOT_TO_LAYER,
  SPRITE_LAYER_ORDER,
} from './spriteManifest'
import type { CharacterSlot } from '../catalog/types'

describe('sprite path resolvers (public/sprites/avatar/ file naming contract)', () => {
  it('resolves a base body frame path', () => {
    expect(resolveBaseFramePath('boy', 'study', 0)).toBe('/sprites/avatar/base/boy_study_01.png')
  })

  it('pads frame numbers to 2 digits and uses lowercase levelup', () => {
    expect(resolveBaseFramePath('girl', 'levelUp', 9)).toBe('/sprites/avatar/base/girl_levelup_10.png')
  })

  it('resolves a face frame path in its own folder', () => {
    expect(resolveFaceFramePath('boy', 'happy', 2)).toBe('/sprites/avatar/face/boy_happy_03.png')
  })

  it('resolves a gender-neutral effect frame path', () => {
    expect(resolveEffectFramePath('sleep', 0)).toBe('/sprites/avatar/effects/sleep_01.png')
  })

  it('resolves a cosmetic frame path from its assetKey, defaulting to frame 1', () => {
    expect(resolveCosmeticFramePath('hair', 'ribbon')).toBe('/sprites/avatar/hair/ribbon_01.png')
  })

  it('resolves an explicit cosmetic frame index', () => {
    expect(resolveCosmeticFramePath('outfit', 'hoodie', 1)).toBe('/sprites/avatar/outfit/hoodie_02.png')
  })
})

describe('SLOT_TO_LAYER (every catalog slot maps to exactly one render layer)', () => {
  const allSlots: CharacterSlot[] = [
    'bodyBase',
    'skin',
    'hairBack',
    'face',
    'eyes',
    'eyebrows',
    'mouth',
    'blush',
    'bottom',
    'shoes',
    'top',
    'onePiece',
    'outerwear',
    'hairFront',
    'faceAccessory',
    'headAccessory',
    'backAccessory',
    'handheld',
    'stateEffect',
  ]

  it('has a layer mapping for every slot', () => {
    for (const slot of allSlots) {
      expect(SPRITE_LAYER_ORDER).toContain(SLOT_TO_LAYER[slot])
    }
  })

  it('maps the outfit-related slots to the outfit layer', () => {
    expect(SLOT_TO_LAYER.top).toBe('outfit')
    expect(SLOT_TO_LAYER.onePiece).toBe('outfit')
    expect(SLOT_TO_LAYER.outerwear).toBe('outfit')
  })

  it('separates hairBack and hairFront into distinct layers', () => {
    expect(SLOT_TO_LAYER.hairBack).not.toBe(SLOT_TO_LAYER.hairFront)
  })
})

describe('LAYER_TO_FOLDER (every layer resolves to one of the 6 real folders)', () => {
  it('has a folder for every layer', () => {
    for (const layer of SPRITE_LAYER_ORDER) {
      expect(LAYER_TO_FOLDER[layer]).toBeTruthy()
    }
  })

  it('puts hairBack and hairFront in the same physical folder (distinguished by filename)', () => {
    expect(LAYER_TO_FOLDER.hairBack).toBe('hair')
    expect(LAYER_TO_FOLDER.hairFront).toBe('hair')
  })
})
