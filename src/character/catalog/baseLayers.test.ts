import { describe, expect, it } from 'vitest'
import { BASE_LAYER_DEFAULTS, resolveActiveBaseLayerDefaults, type BaseLayerDefinition } from './baseLayers'
import type { SpriteLayer } from '../engine/spriteManifest'

describe('BASE_LAYER_DEFAULTS', () => {
  it('declares exactly hairBack, hairFront, and outfit — no headAccessory/faceAccessory/neckAccessory defaults, matching their OPTIONAL classification (src/cosmetics/types.ts)', () => {
    expect(BASE_LAYER_DEFAULTS.map((d) => d.layer).sort()).toEqual(['hairBack', 'hairFront', 'outfit'])
  })

  it('shares one assetKey (default-hair) across both hair layer pieces, so they can only activate together', () => {
    const hairDefs = BASE_LAYER_DEFAULTS.filter((d) => d.layer === 'hairBack' || d.layer === 'hairFront')
    expect(hairDefs.every((d) => d.assetKey === 'default-hair')).toBe(true)
  })

  it('gives outfit its own independent assetKey, not coupled to hair', () => {
    const outfitDef = BASE_LAYER_DEFAULTS.find((d) => d.layer === 'outfit')
    expect(outfitDef?.assetKey).toBe('default-outfit')
    expect(outfitDef?.assetKey).not.toBe('default-hair')
  })
})

describe('resolveActiveBaseLayerDefaults', () => {
  const defs: BaseLayerDefinition[] = [
    { layer: 'hairBack', folder: 'hair-back', assetKey: 'default-hair' },
    { layer: 'hairFront', folder: 'hair-front', assetKey: 'default-hair' },
    { layer: 'outfit', folder: 'outfit', assetKey: 'default-outfit' },
  ]

  it('returns nothing when no default assetKey is supported yet (today\'s real state)', () => {
    expect(resolveActiveBaseLayerDefaults(new Set(), new Set(), defs)).toEqual([])
  })

  it('returns a default once its assetKey is supported and nothing real occupies its layer', () => {
    const result = resolveActiveBaseLayerDefaults(new Set(), new Set(['default-hair', 'default-outfit']), defs)
    expect(result).toEqual(defs)
  })

  it('suppresses default-outfit once a real cosmetic already renders into the outfit layer — never stacks under it', () => {
    const equippedLayers = new Set<SpriteLayer>(['outfit'])
    const result = resolveActiveBaseLayerDefaults(equippedLayers, new Set(['default-hair', 'default-outfit']), defs)
    expect(result.map((d) => d.layer)).toEqual(['hairBack', 'hairFront'])
  })

  it('suppresses only the occupied layer, leaving other confirmed defaults active', () => {
    const equippedLayers = new Set<SpriteLayer>(['hairBack', 'hairFront'])
    const result = resolveActiveBaseLayerDefaults(equippedLayers, new Set(['default-hair', 'default-outfit']), defs)
    expect(result.map((d) => d.layer)).toEqual(['outfit'])
  })

  it('never returns a default whose assetKey is not in the supported set, even if its layer is free', () => {
    const result = resolveActiveBaseLayerDefaults(new Set(), new Set(['default-outfit']), defs)
    expect(result.map((d) => d.layer)).toEqual(['outfit'])
  })
})
