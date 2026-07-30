/** Picks a readable ink color for text/UI sitting on an arbitrary equipped
 * background color, using perceived luminance (docs/StudyLog_Character_System_Fix_PRD_v1.0.md
 * §7: "dark backgrounds maintain readable UI and character contrast"). */
export function readableInkColor(hexColor: string | undefined, fallback: string): string {
  if (!hexColor) return fallback
  const hex = hexColor.replace('#', '')
  if (hex.length !== 6) return fallback
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5 ? '#F5F2FF' : fallback
}
