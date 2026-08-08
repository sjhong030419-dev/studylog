import { describe, expect, it } from 'vitest'
import {
  CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER,
  LAYER_TO_FOLDER,
  resolveBareBaseFramePath,
  resolveBaseFramePath,
  resolveCosmeticLayerPath,
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

  it('resolves a bare-base frame path under the new avatar-layers root, with no frame number', () => {
    expect(resolveBareBaseFramePath('boy', 'study')).toBe('/sprites/avatar-layers/base/boy/study.png')
  })
})

describe('resolveCosmeticLayerPath (docs/StudyLog_Asset_Layer_Spec_v1.0.md §5 — gender/state-aware, replaces the old flat resolveCosmeticFramePath)', () => {
  it('resolves a real gender + state combination', () => {
    expect(resolveCosmeticLayerPath('outfit', 'purple-hoodie', 'boy', 'study')).toBe(
      '/sprites/avatar-layers/outfit/purple-hoodie/boy/study.png',
    )
  })

  it('accepts "unisex" in place of a specific gender for shared art', () => {
    expect(resolveCosmeticLayerPath('head-accessory', 'ribbon', 'unisex', 'idle')).toBe(
      '/sprites/avatar-layers/head-accessory/ribbon/unisex/idle.png',
    )
  })

  it('resolves every declared folder', () => {
    const folders = ['hair-back', 'outfit', 'hair-front', 'head-accessory', 'face-accessory', 'neck-accessory'] as const
    for (const folder of folders) {
      expect(resolveCosmeticLayerPath(folder, 'test-key', 'girl', 'happy')).toBe(
        `/sprites/avatar-layers/${folder}/test-key/girl/happy.png`,
      )
    }
  })
})

describe('CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER', () => {
  it('maps every real slot used by the 12 existing shop items to a real folder', () => {
    // top/onePiece (outfit), headAccessory, faceAccessory, backAccessory —
    // every CharacterSlot character/catalog/items.ts actually uses today.
    for (const slot of ['top', 'onePiece', 'headAccessory', 'faceAccessory', 'backAccessory'] as CharacterSlot[]) {
      expect(CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER[slot]).toBeDefined()
    }
  })

  it('maps backAccessory to its own neck-accessory folder, not head/face', () => {
    expect(CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER.backAccessory).toBe('neck-accessory')
  })

  it('has no folder for slots this path family does not cover (body/face/shoe/handheld/stateEffect)', () => {
    for (const slot of ['bodyBase', 'skin', 'face', 'eyes', 'eyebrows', 'mouth', 'blush', 'bottom', 'shoes', 'handheld', 'stateEffect'] as CharacterSlot[]) {
      expect(CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER[slot]).toBeUndefined()
    }
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
