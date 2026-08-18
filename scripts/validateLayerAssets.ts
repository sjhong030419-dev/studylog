/**
 * Readiness check for the first vertical slice
 * (docs/First_Vertical_Slice_Asset_Request.md). Walks every file that
 * request declares, checks whether it exists on disk yet, and if it does,
 * validates its PNG header against the expected canvas size and RGBA mode
 * (scripts/pngLayerValidation.ts, docs/StudyLog_Asset_Layer_Spec_v1.0.md §2/§14).
 *
 * Run manually — this is NOT wired into `npm run test`/`build`/`lint`.
 * Every file this script checks is expected to be missing today (no real
 * art has landed yet); running it now is expected to report 0/64 present,
 * which is correct, not a failure of the codebase.
 *
 *   node scripts/validateLayerAssets.ts
 *
 * Exit code 0 only when every expected file exists and passes validation —
 * safe to use as a real readiness gate once art starts landing.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pad, STATE_FILE_NAME } from '../src/character/engine/spriteManifest.ts'
import { ROOM_ASSET_MANIFEST } from '../src/character/room/roomAssetManifest.ts'
import { STATE_FRAME_COUNT } from '../src/character/types.ts'
import type { CharacterState } from '../src/character/types.ts'
import { validateLayerPng, type LayerPngValidationIssue } from './pngLayerValidation.ts'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const PUBLIC_ROOT = join(REPO_ROOT, 'public')

const GENDERS = ['boy', 'girl'] as const
const STATES = ['idle', 'study', 'sleep', 'happy'] as const

interface ExpectedFile {
  /** Path relative to public/, matching docs/First_Vertical_Slice_Asset_Request.md. */
  relativePath: string
  width: number
  height: number
}

const AVATAR_LAYER_SIZE = { width: 160, height: 160 }
const ROOM_LAYER_SIZE = { width: 640, height: 800 }
const WHOLE_AVATAR_SIZE = { width: 160, height: 160 }

function avatarLayerFiles(folder: string, assetKey: string): ExpectedFile[] {
  return GENDERS.flatMap((gender) =>
    STATES.map((state) => ({
      relativePath: `sprites/avatar-layers/${folder}/${assetKey}/${gender}/${state}.png`,
      ...AVATAR_LAYER_SIZE,
    })),
  )
}

function bareBaseFiles(): ExpectedFile[] {
  return GENDERS.flatMap((gender) =>
    STATES.map((state) => ({
      relativePath: `sprites/avatar-layers/base/${gender}/${state}.png`,
      ...AVATAR_LAYER_SIZE,
    })),
  )
}

/** The 48 avatar files (docs/First_Vertical_Slice_Asset_Request.md §2a-2e):
 * bare base (8) + default-hair's two pieces (16) + default-outfit (8) +
 * the outfit-blue swap, assetKey `hoodie` (8) + the hair-ribbon head
 * accessory, assetKey `ribbon` (8). */
const AVATAR_FILES: ExpectedFile[] = [
  ...bareBaseFiles(),
  ...avatarLayerFiles('hair-back', 'default-hair'),
  ...avatarLayerFiles('hair-front', 'default-hair'),
  ...avatarLayerFiles('outfit', 'default-outfit'),
  ...avatarLayerFiles('outfit', 'hoodie'),
  ...avatarLayerFiles('head-accessory', 'ribbon'),
]

/** The 16 room files (15 baseline layers + the 1 planned desk prop) — read
 * directly from the real manifest (src/character/room/roomAssetManifest.ts)
 * rather than re-listed by hand, so this script can never silently drift
 * out of sync with what the app actually asks for. */
const ROOM_FILES: ExpectedFile[] = ROOM_ASSET_MANIFEST['default-night'].map((layer) => ({
  relativePath: layer.src.replace(/^\//, ''), // manifest src is an absolute "/sprites/..." URL path
  ...ROOM_LAYER_SIZE,
}))

const EXPECTED_FILES: ExpectedFile[] = [...AVATAR_FILES, ...ROOM_FILES]

/**
 * The 104 delivered whole-avatar black-hair files
 * (docs/Claude_Black_Hair_Whole_Avatar_Implementation_Prompt.md) —
 * `public/sprites/avatar/whole/black-hair/girl_{state}_{frame}.png`, girl
 * only, every `CharacterState` at its real `STATE_FRAME_COUNT`. Reuses the
 * same `STATE_FILE_NAME`/`pad` filename convention as the base sprites
 * (character/engine/spriteManifest.ts) and the same `STATE_FRAME_COUNT`
 * table the app itself animates against (character/types.ts) rather than
 * hand-listing state names or frame counts a second time here, so this
 * check can never silently drift out of sync with what
 * wholeAvatarSupport.ts actually resolves paths against.
 *
 * A wholly separate, independently-reported check from `AVATAR_FILES`/
 * `ROOM_FILES` above (a different asset family, different delivery status)
 * — see `main()`'s dedicated "Whole-avatar black-hair files" summary line.
 */
export function buildBlackHairExpectedFiles(): ExpectedFile[] {
  return (['girl', 'boy'] as const).flatMap((gender) =>
    (Object.keys(STATE_FRAME_COUNT) as CharacterState[]).flatMap((state) =>
      Array.from({ length: STATE_FRAME_COUNT[state] }, (_, frameIndex) => ({
        relativePath: `sprites/avatar/whole/black-hair/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`,
        ...WHOLE_AVATAR_SIZE,
      })),
    ),
  )
}

export function buildSakuraUniformExpectedFiles(): ExpectedFile[] {
  return (['girl', 'boy'] as const).flatMap((gender) =>
    (Object.keys(STATE_FRAME_COUNT) as CharacterState[]).flatMap((state) =>
      Array.from({ length: STATE_FRAME_COUNT[state] }, (_, frameIndex) => ({
        relativePath: `sprites/avatar/whole/sakura-uniform/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`,
        ...WHOLE_AVATAR_SIZE,
      })),
    ),
  )
}

export function buildSakuraUniformRibbonExpectedFiles(): ExpectedFile[] {
  return (['girl', 'boy'] as const).flatMap((gender) =>
    (Object.keys(STATE_FRAME_COUNT) as CharacterState[]).flatMap((state) =>
      Array.from({ length: STATE_FRAME_COUNT[state] }, (_, frameIndex) => ({
        relativePath: `sprites/avatar/whole/sakura-uniform-ribbon/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`,
        ...WHOLE_AVATAR_SIZE,
      })),
    ),
  )
}

const BLACK_HAIR_FILES: ExpectedFile[] = buildBlackHairExpectedFiles()
const SAKURA_UNIFORM_FILES: ExpectedFile[] = buildSakuraUniformExpectedFiles()
const SAKURA_UNIFORM_RIBBON_FILES: ExpectedFile[] = buildSakuraUniformRibbonExpectedFiles()

export type FileReport =
  | { relativePath: string; status: 'missing' }
  | { relativePath: string; status: 'valid' }
  | { relativePath: string; status: 'invalid'; issues: LayerPngValidationIssue[] }

export function checkFile(expected: ExpectedFile): FileReport {
  const absolutePath = join(PUBLIC_ROOT, expected.relativePath)
  if (!existsSync(absolutePath)) {
    return { relativePath: expected.relativePath, status: 'missing' }
  }
  const buffer = readFileSync(absolutePath)
  const issues = validateLayerPng(buffer, expected.width, expected.height)
  if (issues.length === 0) {
    return { relativePath: expected.relativePath, status: 'valid' }
  }
  return { relativePath: expected.relativePath, status: 'invalid', issues }
}

function main() {
  const reports = EXPECTED_FILES.map(checkFile)
  const missing = reports.filter((r) => r.status === 'missing')
  const invalid = reports.filter((r) => r.status === 'invalid')
  const valid = reports.filter((r) => r.status === 'valid')

  console.log(`Checked ${EXPECTED_FILES.length} expected files (${AVATAR_FILES.length} avatar + ${ROOM_FILES.length} room).`)
  console.log(`  valid:   ${valid.length}`)
  console.log(`  missing: ${missing.length}`)
  console.log(`  invalid: ${invalid.length}`)

  if (invalid.length > 0) {
    console.log('\nInvalid files:')
    for (const r of invalid) {
      if (r.status !== 'invalid') continue
      console.log(`  ${r.relativePath}`)
      for (const issue of r.issues) console.log(`    - [${issue.type}] ${issue.message}`)
    }
  }

  if (missing.length > 0) {
    console.log(`\n${missing.length} file(s) not delivered yet — see docs/First_Vertical_Slice_Asset_Request.md.`)
  }

  // Reported separately from the block above: a wholly different, already-
  // delivered asset family (docs/Claude_Black_Hair_Whole_Avatar_Implementation_Prompt.md),
  // not part of the intentionally-incomplete avatar-layers vertical slice.
  const blackHairReports = BLACK_HAIR_FILES.map(checkFile)
  const blackHairMissing = blackHairReports.filter((r) => r.status === 'missing')
  const blackHairInvalid = blackHairReports.filter((r) => r.status === 'invalid')
  const blackHairValid = blackHairReports.filter((r) => r.status === 'valid')

  console.log(
    `\nWhole-avatar black-hair files: ${blackHairValid.length} valid, ${blackHairMissing.length} missing, ${blackHairInvalid.length} invalid`,
  )

  if (blackHairInvalid.length > 0) {
    console.log('\nInvalid black-hair files:')
    for (const r of blackHairInvalid) {
      if (r.status !== 'invalid') continue
      console.log(`  ${r.relativePath}`)
      for (const issue of r.issues) console.log(`    - [${issue.type}] ${issue.message}`)
    }
  }

  if (blackHairMissing.length > 0) {
    console.log('\nMissing black-hair files:')
    for (const r of blackHairMissing) console.log(`  ${r.relativePath}`)
  }

  const sakuraReports = SAKURA_UNIFORM_FILES.map(checkFile)
  const sakuraMissing = sakuraReports.filter((r) => r.status === 'missing')
  const sakuraInvalid = sakuraReports.filter((r) => r.status === 'invalid')
  const sakuraValid = sakuraReports.filter((r) => r.status === 'valid')

  console.log(
    `\nWhole-avatar sakura-uniform files: ${sakuraValid.length} valid, ${sakuraMissing.length} missing, ${sakuraInvalid.length} invalid`,
  )

  const sakuraRibbonReports = SAKURA_UNIFORM_RIBBON_FILES.map(checkFile)
  const sakuraRibbonMissing = sakuraRibbonReports.filter((r) => r.status === 'missing')
  const sakuraRibbonInvalid = sakuraRibbonReports.filter((r) => r.status === 'invalid')
  const sakuraRibbonValid = sakuraRibbonReports.filter((r) => r.status === 'valid')

  console.log(
    `\nWhole-avatar sakura-uniform-ribbon files: ${sakuraRibbonValid.length} valid, ${sakuraRibbonMissing.length} missing, ${sakuraRibbonInvalid.length} invalid`,
  )

  const allValid =
    valid.length === EXPECTED_FILES.length &&
    blackHairValid.length === BLACK_HAIR_FILES.length &&
    sakuraValid.length === SAKURA_UNIFORM_FILES.length &&
    sakuraRibbonValid.length === SAKURA_UNIFORM_RIBBON_FILES.length

  if (allValid) {
    console.log('\nAll expected files present and valid.')
    process.exit(0)
  }
  process.exit(1)
}

// Only run as a CLI (`node scripts/validateLayerAssets.ts`) — importing this
// module from a test file (scripts/validateLayerAssets.test.ts) must be able
// to reuse `buildBlackHairExpectedFiles`/`checkFile` without triggering a
// real filesystem walk + `process.exit()` as a side effect of import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
