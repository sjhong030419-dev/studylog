import type { CharacterAppearance, Gender } from '../types'

/** Palette + default outfit from docs/character-system.md §3-4. Boy and
 * girl share the same design language and only differ in hairstyle
 * silhouette (drawn in fallback/) — not in these base colors. */
export const DEFAULT_PRESETS: Record<Gender, CharacterAppearance> = {
  boy: {
    gender: 'boy',
    skinTone: '#FFE4B6',
    hairColor: '#A67C58',
    outfitColor: '#8E68FF',
    pantsColor: '#E7CBA1',
    shoeColor: '#FFFFFF',
    outlineColor: '#5B3F2B',
  },
  girl: {
    gender: 'girl',
    skinTone: '#FFE4B6',
    hairColor: '#A67C58',
    outfitColor: '#8E68FF',
    pantsColor: '#E7CBA1',
    shoeColor: '#FFFFFF',
    outlineColor: '#5B3F2B',
  },
}

export function resolveAppearance(gender: Gender, overrides?: Partial<CharacterAppearance>): CharacterAppearance {
  return { ...DEFAULT_PRESETS[gender], ...overrides }
}
