/**
 * Original SVG placeholder parts for the cosmetic catalog
 * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §9). These are explicitly
 * temporary hand-drawn vector shapes, not production art — see
 * docs/character-system.md for the target pixel-illustration spec. Each
 * part is anchored to the same 200x240 character canvas the base body
 * uses, so no per-item positioning logic is needed in the renderer.
 */

interface AssetPartProps {
  outlineColor: string
}

export function RibbonPart({ outlineColor }: AssetPartProps) {
  return (
    <g transform="translate(132, 46)">
      <path
        d="M 0 0 L 10 -6 L 12 2 L 20 -2 L 14 6 L 20 10 L 10 8 L 8 16 L 4 8 L -6 10 L 2 2 Z"
        fill="#FF9DBE"
        stroke={outlineColor}
        strokeWidth="1.5"
      />
    </g>
  )
}

export function StrawHatPart({ outlineColor }: AssetPartProps) {
  return (
    <g>
      <ellipse cx="100" cy="46" rx="54" ry="11" fill="#E8C88A" stroke={outlineColor} strokeWidth="2" />
      <path d="M 68 46 Q 68 18 100 16 Q 132 18 132 46 Z" fill="#F2D9A6" stroke={outlineColor} strokeWidth="2" />
      <rect x="68" y="42" width="64" height="6" fill="#D9A86A" />
    </g>
  )
}

export function CapPart({ outlineColor }: AssetPartProps) {
  return (
    <g>
      <path d="M 60 44 Q 62 12 100 10 Q 138 12 140 44 Q 100 34 60 44 Z" fill="#4A4458" stroke={outlineColor} strokeWidth="2" />
      <path d="M 60 44 Q 100 34 140 44 L 148 50 Q 100 40 52 50 Z" fill="#3A3548" stroke={outlineColor} strokeWidth="1.5" />
    </g>
  )
}

export function GlassesPart({ outlineColor }: AssetPartProps) {
  return (
    <g fill="none" stroke={outlineColor} strokeWidth="2.5">
      <circle cx="84" cy="80" r="11" />
      <circle cx="116" cy="80" r="11" />
      <line x1="95" y1="80" x2="105" y2="80" />
      <line x1="73" y1="78" x2="66" y2="76" />
      <line x1="127" y1="78" x2="134" y2="76" />
    </g>
  )
}

export function HeadphonesPart({ outlineColor }: AssetPartProps) {
  return (
    <g>
      <path d="M 54 78 Q 54 30 100 28 Q 146 30 146 78" fill="none" stroke={outlineColor} strokeWidth="4" strokeLinecap="round" />
      <rect x="46" y="72" width="16" height="26" rx="7" fill="#9B86D9" stroke={outlineColor} strokeWidth="2" />
      <rect x="138" y="72" width="16" height="26" rx="7" fill="#9B86D9" stroke={outlineColor} strokeWidth="2" />
    </g>
  )
}

export function NecklacePart({ outlineColor }: AssetPartProps) {
  return (
    <g>
      <path d="M 88 120 Q 100 132 112 120" fill="none" stroke="#E8B94D" strokeWidth="2.5" />
      <path d="M 95 128 L 100 136 L 105 128 Z" fill="#A9D4FF" stroke={outlineColor} strokeWidth="1.2" />
    </g>
  )
}
