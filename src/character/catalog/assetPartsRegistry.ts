import {
  RibbonPart,
  StrawHatPart,
  CapPart,
  GlassesPart,
  HeadphonesPart,
  NecklacePart,
} from './assetParts'

interface AssetPartProps {
  outlineColor: string
}

/** assetKey -> SVG part renderer. Adding a new ordinary cosmetic never
 * requires touching the character renderer — only a new part here (or a
 * palette-recolor of an existing one) plus a catalog entry
 * (docs/StudyLog_Character_System_Fix_PRD_v1.0.md §9). */
export const ASSET_PARTS: Record<string, (props: AssetPartProps) => React.ReactNode> = {
  ribbon: RibbonPart,
  strawHat: StrawHatPart,
  cap: CapPart,
  glasses: GlassesPart,
  headphones: HeadphonesPart,
  necklace: NecklacePart,
}
