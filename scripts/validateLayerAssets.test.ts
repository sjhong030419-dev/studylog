import { describe, expect, it } from 'vitest'
import { STATE_FRAME_COUNT } from '../src/character/types.ts'
import type { CharacterState } from '../src/character/types.ts'
import {
  buildBlackHairExpectedFiles,
  buildFullSceneExpectedFiles,
  buildSakuraUniformExpectedFiles,
  checkFile,
  checkWebpFile,
} from './validateLayerAssets.ts'

/**
 * Covers the black-hair whole-avatar asset validation added to
 * scripts/validateLayerAssets.ts
 * (docs/Claude_Black_Hair_Whole_Avatar_Implementation_Prompt.md). Runs
 * against the real 104 delivered files under
 * public/sprites/avatar/whole/black-hair/ — this is an integration check of
 * already-approved, checked-in art, not synthetic fixture data, matching how
 * scripts/pngLayerValidation.test.ts already unit-tests the lower-level PNG
 * header parser these checks build on.
 */

const ALL_STATES: CharacterState[] = [
  'idle',
  'study',
  'thinking',
  'reading',
  'typing',
  'break',
  'sleep',
  'happy',
  'excited',
  'celebrate',
  'levelUp',
  'focused',
  'away',
]

describe('buildBlackHairExpectedFiles', () => {
  const files = buildBlackHairExpectedFiles()

  it('required test 1 — expects exactly 104 files', () => {
    expect(files).toHaveLength(208)
  })

  it('required test 2 — covers all 13 CharacterState values', () => {
    for (const state of ALL_STATES) {
      const stateFileName = state === 'levelUp' ? 'levelup' : state
      const matches = files.filter((f) => f.relativePath.includes(`_${stateFileName}_`))
      expect(matches.length).toBeGreaterThan(0)
    }
  })

  it('required test 3 — each state contributes exactly STATE_FRAME_COUNT frames, matching the app-wide table (no duplicated frame rule)', () => {
    for (const state of ALL_STATES) {
      const stateFileName = state === 'levelUp' ? 'levelup' : state
      const matches = files.filter((f) => f.relativePath.includes(`_${stateFileName}_`))
      expect(matches).toHaveLength(STATE_FRAME_COUNT[state] * 2)
    }
  })

  it('builds complete girl and boy paths', () => {
    expect(files.some((f) => f.relativePath.includes('/black-hair/girl_'))).toBe(true)
    expect(files.some((f) => f.relativePath.includes('/black-hair/boy_'))).toBe(true)
  })

  it('expects every file to be a 160x160 canvas', () => {
    expect(files.every((f) => f.width === 160 && f.height === 160)).toBe(true)
  })

  it('reuses STATE_FILE_NAME/pad exactly — asserts the documented example paths', () => {
    const relativePaths = files.map((f) => f.relativePath)
    expect(relativePaths).toContain('sprites/avatar/whole/black-hair/girl_idle_01.png')
    expect(relativePaths).toContain('sprites/avatar/whole/black-hair/girl_study_01.png')
    expect(relativePaths).toContain('sprites/avatar/whole/black-hair/girl_celebrate_12.png')
    expect(relativePaths).toContain('sprites/avatar/whole/black-hair/girl_levelup_12.png')
  })
})

describe('checkFile against the real delivered black-hair assets', () => {
  it('required test 4 — every one of the 104 real files is a valid 160x160 RGBA PNG', () => {
    const files = buildBlackHairExpectedFiles()
    const reports = files.map(checkFile)
    const invalid = reports.filter((r) => r.status !== 'valid')
    expect(invalid).toEqual([])
    expect(reports.filter((r) => r.status === 'valid')).toHaveLength(208)
  })
})

describe('checkFile — missing-file detection', () => {
  it('required test 5 — reports status "missing" for a file that does not exist on disk, instead of throwing', () => {
    const report = checkFile({
      relativePath: 'sprites/avatar/whole/black-hair/girl_idle_99.png',
      width: 160,
      height: 160,
    })
    expect(report.status).toBe('missing')
  })

  it('a single missing file among many keeps the batch check honest (not silently skipped)', () => {
    const files = [
      ...buildBlackHairExpectedFiles(),
      { relativePath: 'sprites/avatar/whole/black-hair/girl_does_not_exist.png', width: 160, height: 160 },
    ]
    const reports = files.map(checkFile)
    expect(reports.filter((r) => r.status === 'missing')).toHaveLength(1)
    expect(reports.filter((r) => r.status === 'valid')).toHaveLength(208)
  })
})

describe('sakura-uniform whole-avatar assets', () => {
  it('expects and validates all 208 girl and boy production files', () => {
    const files = buildSakuraUniformExpectedFiles()
    expect(files).toHaveLength(208)
    expect(files.map(checkFile).filter((report) => report.status !== 'valid')).toEqual([])
  })
})

describe('baked full-scene room assets', () => {
  it('covers and validates 3 themes × 2 genders × 4 scenes', () => {
    const files = buildFullSceneExpectedFiles()
    expect(files).toHaveLength(24)
    expect(files.every((file) => checkWebpFile(file) === 'valid')).toBe(true)
    expect(files).toContain('sprites/room/default-night/scenes/boy/idle.webp')
    expect(files).toContain('sprites/room/sakura-uniform-ribbon/scenes/girl/study.webp')
  })

  it('reports a missing WebP without throwing', () => {
    expect(checkWebpFile('sprites/room/missing/scenes/boy/idle.webp')).toBe('missing')
  })
})
