/**
 * Engineering validation for delivered layer PNGs
 * (docs/StudyLog_Asset_Layer_Spec_v1.0.md §2 "Non-negotiable Rules", §14
 * "Engineering Validation" — "Verify dimensions and RGBA mode for all
 * registered PNGs"). Pure buffer parsing, no filesystem access, so it's
 * fully unit-testable today with hand-built synthetic PNG headers — none of
 * the real 640×800 RGBA layer files this vertical slice needs exist yet.
 *
 * Not wired into `npm run test`/`build`/`lint` as a required gate: there is
 * nothing real to check today, and this file intentionally lives under
 * scripts/ (not src/) so it never gets pulled into the browser bundle —
 * PNG byte parsing is Node/build-tooling concern, not app runtime code.
 * Once real assets land, a small CLI wrapper (`node --experimental-strip-types
 * scripts/validateLayerAssets.ts public/sprites/...`) can walk
 * `ROOM_ASSET_MANIFEST`/the avatar layer manifest and call `validateLayerPng`
 * against each real file — see docs/First_Vertical_Slice_Asset_Request.md
 * "Delivery format" for what that check enforces.
 */

export interface PngHeader {
  width: number
  height: number
  bitDepth: number
  /** PNG color type byte: 0 grayscale, 2 truecolor (RGB, no alpha), 3
   * indexed, 4 grayscale+alpha, 6 truecolor+alpha (RGBA) — the only value
   * the asset spec allows for a layer file. */
  colorType: number
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** Parses just enough of a PNG's leading bytes (signature + IHDR chunk) to
 * get its dimensions and color mode — returns `null` for anything that
 * isn't a real PNG (wrong signature, truncated buffer, missing IHDR) rather
 * than throwing, since a corrupt/misnamed file must fail validation
 * cleanly, not crash whatever tool is running the check. */
export function parsePngHeader(buffer: Buffer): PngHeader | null {
  if (buffer.length < 8 + 8 + 13) return null
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null

  const chunkType = buffer.toString('ascii', 12, 16)
  if (chunkType !== 'IHDR') return null

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer.readUInt8(24),
    colorType: buffer.readUInt8(25),
  }
}

export const RGBA_COLOR_TYPE = 6

export interface LayerPngValidationIssue {
  type: 'unreadable' | 'wrong-dimensions' | 'not-rgba'
  message: string
}

/**
 * Checks one layer PNG's header against the asset spec's non-negotiable
 * rules (§2): exact canvas dimensions (no auto-trim/cropped bounding box —
 * a trimmed layer would report smaller-than-expected dimensions here) and
 * RGBA color mode (no white matte / opaque background). Returns an empty
 * array for a valid file.
 */
export function validateLayerPng(
  buffer: Buffer,
  expectedWidth: number,
  expectedHeight: number,
): LayerPngValidationIssue[] {
  const header = parsePngHeader(buffer)
  if (!header) {
    return [{ type: 'unreadable', message: 'Not a readable PNG (bad signature or missing/truncated IHDR chunk).' }]
  }

  const issues: LayerPngValidationIssue[] = []

  if (header.width !== expectedWidth || header.height !== expectedHeight) {
    issues.push({
      type: 'wrong-dimensions',
      message: `Expected ${expectedWidth}x${expectedHeight}, got ${header.width}x${header.height} — canvas must not be trimmed or cropped.`,
    })
  }

  if (header.colorType !== RGBA_COLOR_TYPE) {
    issues.push({
      type: 'not-rgba',
      message: `Expected RGBA (color type ${RGBA_COLOR_TYPE}), got color type ${header.colorType} — transparent background required, no white matte.`,
    })
  }

  return issues
}
