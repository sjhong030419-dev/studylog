import type { CharacterSlot } from '../catalog/types'
import type { CharacterState, Gender } from '../types'

/**
 * Single source of truth for every real sprite file path this app will
 * ever ask for. No component or store should ever hand-write a
 * `/sprites/...` string — they call one of the `resolve*Path` functions
 * below instead. This is what makes the eventual PNG asset drop-in a
 * one-file change (flip `SPRITE_ASSETS_AVAILABLE` in `spriteAssetMap.ts`);
 * every path convention lives here, in one place.
 *
 * See docs/character-system.md §9-§12 for the full asset contract this
 * mirrors, and §13 for the list of files still needed before this can be
 * switched on for real.
 */

/** Square canvas, transparent PNG, per character-only sprite frame. 160 is
 * chosen over the alternative 128 for a chibi silhouette: the oversized
 * head/hair that defines the "치비" proportion needs headroom that 128px
 * starts clipping at typical accessory detail (ribbons, headphones). */
export const SPRITE_CANVAS_SIZE = 160

/**
 * The 10 independently-expandable render layers (back -> front), exactly
 * as specified for this system. Every cosmetic slot in
 * `character/catalog/types.ts` maps to exactly one of these — see
 * `SLOT_TO_LAYER` below.
 */
export type SpriteLayer =
  | 'base'
  | 'skin'
  | 'eyes'
  | 'mouth'
  | 'hairBack'
  | 'outfit'
  | 'hairFront'
  | 'accessory'
  | 'handheld'
  | 'stateEffect'

export const SPRITE_LAYER_ORDER: SpriteLayer[] = [
  'base',
  'skin',
  'eyes',
  'mouth',
  'hairBack',
  'outfit',
  'hairFront',
  'accessory',
  'handheld',
  'stateEffect',
]

/** Which render layer each existing cosmetic slot (character/catalog/types.ts)
 * draws into. The catalog's 19 slots stay exactly as they are — a slot is
 * "what item is equipped", a layer is "what order it paints in" — this is
 * purely the mapping between the two, so nothing about the existing shop
 * catalog needs to change. */
export const SLOT_TO_LAYER: Record<CharacterSlot, SpriteLayer> = {
  bodyBase: 'base',
  skin: 'skin',
  hairBack: 'hairBack',
  face: 'eyes',
  eyes: 'eyes',
  eyebrows: 'eyes',
  mouth: 'mouth',
  blush: 'mouth',
  bottom: 'outfit',
  shoes: 'outfit',
  top: 'outfit',
  onePiece: 'outfit',
  outerwear: 'outfit',
  hairFront: 'hairFront',
  faceAccessory: 'accessory',
  headAccessory: 'accessory',
  backAccessory: 'accessory',
  handheld: 'handheld',
  stateEffect: 'stateEffect',
}

/** The 6 physical folders under `public/sprites/avatar/` (docs
 * character-system.md §12). Several render layers share one folder — e.g.
 * `hairBack` and `hairFront` both live under `hair/`, distinguished by
 * filename, not by folder. */
export type SpriteFolder = 'base' | 'hair' | 'outfit' | 'accessory' | 'face' | 'effects'

export const LAYER_TO_FOLDER: Record<SpriteLayer, SpriteFolder> = {
  base: 'base',
  skin: 'base',
  eyes: 'face',
  mouth: 'face',
  hairBack: 'hair',
  outfit: 'outfit',
  hairFront: 'hair',
  accessory: 'accessory',
  handheld: 'accessory',
  stateEffect: 'effects',
}

const STATE_FILE_NAME: Record<CharacterState, string> = {
  idle: 'idle',
  study: 'study',
  thinking: 'thinking',
  reading: 'reading',
  typing: 'typing',
  break: 'break',
  sleep: 'sleep',
  happy: 'happy',
  excited: 'excited',
  celebrate: 'celebrate',
  levelUp: 'levelup',
  focused: 'focused',
  away: 'away',
}

function pad(frameIndex: number): string {
  return String(frameIndex + 1).padStart(2, '0')
}

/** `base/(gender)_(state)_(frame).png` — the character's body, animated
 * per state (docs §9 file naming, unchanged from the original spec). */
export function resolveBaseFramePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/base/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/** `face/(gender)_(state)_(frame).png` — eyes/mouth/expression, animated
 * per state independently of the body (lets blinking/talking run on its
 * own frame count without needing a full-body redraw per expression). */
export function resolveFaceFramePath(gender: Gender, state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/face/${gender}_${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/** `effects/(state)_(frame).png` — state overlays (Zzz, sparkles, sweat
 * drop, …). Gender-neutral: the same effect sprite works over either base. */
export function resolveEffectFramePath(state: CharacterState, frameIndex: number): string {
  return `/sprites/avatar/effects/${STATE_FILE_NAME[state]}_${pad(frameIndex)}.png`
}

/**
 * Root for the newer, spec-compliant layered avatar asset family
 * (docs/StudyLog_Asset_Layer_Spec_v1.0.md §5) — deliberately NOT under
 * `/sprites/avatar/`, which already holds ~208 flat, `{gender}_{state}_{frame}`
 * -named baked-in-default files (`resolveBaseFramePath` above). Mixing the
 * two naming conventions in the same folder risks real filename collisions
 * and confuses "is this the old baked-in system or the new decomposed
 * one" — a separate root makes that unambiguous from the path alone.
 */
const AVATAR_LAYERS_ROOT = '/sprites/avatar-layers'

/** The avatar cosmetic-layer folders — the 5 the Asset Layer Spec §5
 * lists, plus `neck-accessory` (not in the spec's list; added so
 * `acc-necklace`, which the Phase 1 cosmetic domain already gives its own
 * `neckAccessory` CosmeticSlot — src/cosmetics/types.ts — has a real
 * folder to resolve a path into instead of being silently unmappable).
 * Finer-grained than `LAYER_TO_FOLDER`'s 3 legacy folders, which collapse
 * hairBack+hairFront into one `hair/` folder and every accessory kind
 * (head/face/back) into one `accessory/` folder. New assets use these;
 * nothing currently maps `SLOT_TO_LAYER`/`LAYER_TO_FOLDER` to them because
 * no real file exists under either scheme yet — see spriteSupport.ts. */
export type AvatarLayerFolder = 'hair-back' | 'outfit' | 'hair-front' | 'head-accessory' | 'face-accessory' | 'neck-accessory'

/** Maps a `CharacterSlot` (character/catalog/types.ts) to the new,
 * gender/state-aware `AvatarLayerFolder` a real cosmetic file for that slot
 * would live under. `undefined` for every slot this new path family has no
 * folder for yet (body/face/shoe slots, `handheld`, `stateEffect`) — those
 * simply never resolve a cosmetic-layer path, exactly like today. */
export const CHARACTER_SLOT_TO_AVATAR_LAYER_FOLDER: Partial<Record<CharacterSlot, AvatarLayerFolder>> = {
  hairBack: 'hair-back',
  hairFront: 'hair-front',
  top: 'outfit',
  onePiece: 'outfit',
  outerwear: 'outfit',
  headAccessory: 'head-accessory',
  faceAccessory: 'face-accessory',
  backAccessory: 'neck-accessory',
}

/**
 * `avatar-layers/base/{gender}/{state}.png` — the "bare" body with no hair
 * or outfit baked in, per the Asset Layer Spec's target architecture
 * (§5, §10 "Full-scene migration" step 2). Not requested by any renderer
 * until `spriteSupport.ts`'s `BARE_BASE_CONFIRMED_GENDERS` includes a
 * gender (empty today) — until then `resolveBaseFramePath`'s existing
 * baked-in-default base stays the only base art ever actually fetched.
 */
export function resolveBareBaseFramePath(gender: Gender, state: CharacterState): string {
  return `${AVATAR_LAYERS_ROOT}/base/${gender}/${STATE_FILE_NAME[state]}.png`
}

/**
 * `avatar-layers/{folder}/{assetKey}/{genderOrUnisex}/{state}.png` — every
 * cosmetic layer's real file path, gender- AND state-aware. Replaces the
 * old `resolveCosmeticFramePath` (removed — its one caller,
 * PixelSpriteRenderer.tsx, now calls this instead), which had neither: a
 * single `{assetKey}_{frame}.png` file per item could never represent an
 * outfit drawn differently for a standing `idle` pose vs. a leaning `sleep`
 * pose, or a boy vs. girl body shape. That gap would have forced a real
 * redesign the moment per-state/per-gender cosmetic art actually arrived —
 * fixing the resolver now, while nothing real depends on its old shape
 * (`SUPPORTED_COSMETIC_ASSET_KEYS` is still empty either way), avoids that.
 *
 * `genderOrUnisex` lets one file cover both presets when the art doesn't
 * need to differ (Asset Layer Spec §5: "Shared art may use `unisex`").
 */
export function resolveCosmeticLayerPath(
  folder: AvatarLayerFolder,
  assetKey: string,
  genderOrUnisex: Gender | 'unisex',
  state: CharacterState,
): string {
  return `${AVATAR_LAYERS_ROOT}/${folder}/${assetKey}/${genderOrUnisex}/${STATE_FILE_NAME[state]}.png`
}
