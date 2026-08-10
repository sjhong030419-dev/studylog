import { describe, expect, it } from 'vitest'
import { parsePngHeader, RGBA_COLOR_TYPE, validateLayerPng } from './pngLayerValidation'

/** Builds just the bytes `parsePngHeader` actually reads (signature + IHDR
 * chunk header/data) — no real IDAT/IEND, since nothing under test looks
 * past byte 33. Real production PNGs have far more bytes after this, but a
 * real decoder never needs the whole file to know its dimensions/color
 * mode, and neither does this validator. */
function fakePngHeaderBuffer({
  width,
  height,
  bitDepth = 8,
  colorType = RGBA_COLOR_TYPE,
}: {
  width: number
  height: number
  bitDepth?: number
  colorType?: number
}): Buffer {
  const buf = Buffer.alloc(33)
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0) // signature
  buf.writeUInt32BE(13, 8) // IHDR chunk length
  buf.write('IHDR', 12, 'ascii')
  buf.writeUInt32BE(width, 16)
  buf.writeUInt32BE(height, 20)
  buf.writeUInt8(bitDepth, 24)
  buf.writeUInt8(colorType, 25)
  // bytes 26-32 (compression/filter/interlace + start of CRC) are left 0 —
  // irrelevant to this validator.
  return buf
}

describe('parsePngHeader', () => {
  it('reads width/height/bitDepth/colorType from a valid PNG header', () => {
    const buf = fakePngHeaderBuffer({ width: 640, height: 800, bitDepth: 8, colorType: 6 })
    expect(parsePngHeader(buf)).toEqual({ width: 640, height: 800, bitDepth: 8, colorType: 6 })
  })

  it('returns null for a buffer with the wrong signature (not a PNG at all)', () => {
    const notPng = Buffer.alloc(40, 0)
    expect(parsePngHeader(notPng)).toBeNull()
  })

  it('returns null for a truncated buffer, rather than throwing', () => {
    const tooShort = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    expect(() => parsePngHeader(tooShort)).not.toThrow()
    expect(parsePngHeader(tooShort)).toBeNull()
  })

  it('returns null when the first chunk is not IHDR', () => {
    const buf = fakePngHeaderBuffer({ width: 640, height: 800 })
    buf.write('IDAT', 12, 'ascii') // corrupt the chunk type
    expect(parsePngHeader(buf)).toBeNull()
  })
})

describe('validateLayerPng (docs/StudyLog_Asset_Layer_Spec_v1.0.md §2/§14)', () => {
  it('reports no issues for a correctly-sized RGBA layer', () => {
    const buf = fakePngHeaderBuffer({ width: 640, height: 800, colorType: RGBA_COLOR_TYPE })
    expect(validateLayerPng(buf, 640, 800)).toEqual([])
  })

  it('flags a cropped/trimmed canvas (dimensions smaller than the 640x800 master)', () => {
    const buf = fakePngHeaderBuffer({ width: 512, height: 640, colorType: RGBA_COLOR_TYPE })
    const issues = validateLayerPng(buf, 640, 800)
    expect(issues.some((i) => i.type === 'wrong-dimensions')).toBe(true)
  })

  it('flags an opaque RGB file (color type 2) as not RGBA — no white matte allowed', () => {
    const buf = fakePngHeaderBuffer({ width: 640, height: 800, colorType: 2 })
    const issues = validateLayerPng(buf, 640, 800)
    expect(issues.some((i) => i.type === 'not-rgba')).toBe(true)
  })

  it('flags an unreadable buffer as a single "unreadable" issue, not a crash', () => {
    const garbage = Buffer.from('not a png at all, just some text bytes here')
    expect(() => validateLayerPng(garbage, 640, 800)).not.toThrow()
    expect(validateLayerPng(garbage, 640, 800)).toEqual([
      { type: 'unreadable', message: expect.any(String) },
    ])
  })

  it('can report both a dimension issue and a color-mode issue at once', () => {
    const buf = fakePngHeaderBuffer({ width: 320, height: 400, colorType: 2 })
    const issues = validateLayerPng(buf, 640, 800)
    expect(issues.map((i) => i.type).sort()).toEqual(['not-rgba', 'wrong-dimensions'])
  })
})
