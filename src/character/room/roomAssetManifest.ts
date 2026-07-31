/**
 * Single source of truth for every real room-scene layer file this app will
 * ever ask for (docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md). Mirrors the
 * character sprite system's split between "path/order contract"
 * (character/engine/spriteManifest.ts) and "what actually exists"
 * (character/engine/spriteSupport.ts) — this file is the former for rooms;
 * `roomThemeSupport.ts` is the latter. No component should ever hand-write a
 * `/sprites/room/...` string.
 */

/** The confirmed reference concept (docs/assets/study-room-approved-v1.png,
 * commit 06adca8) is a single flat illustration, not a layered export. Until
 * that art is actually decomposed into these 14 real transparent PNGs, this
 * is the only theme id declared — adding a second theme means adding a new
 * key here once its own reference concept is approved, never inventing one. */
export type RoomThemeId = 'default-night'

/** The 6-stage render pipeline this task specifies (배경 → 후면 소품 → 캐릭터 →
 * 책상과 공부 도구 → 전경 소품 → 조명과 상태 효과), minus the character slot itself
 * (CharacterView is not a room asset — see ROOM_CHARACTER_Z_INDEX below). */
export type RoomLayerGroup = 'background' | 'behindCharacter' | 'deskFront' | 'foreground' | 'lighting'

export interface RoomLayerAsset {
  id: string
  group: RoomLayerGroup
  src: string
  /** CSS z-index. Groups already imply macro ordering; this only breaks ties
   * within (or, for the character's fixed slot, across) a group. */
  zIndex: number
  /** Cumulative level gate, same semantics as growthStages.ts — set only on
   * layers that mirror an existing GROWTH_STAGES unlock (plant/cat) so the
   * pixel room's furniture progression stays identical to the SVG room's. */
  minLevel?: number
  /** Gates this layer on a specific shop item being equipped. No layer in
   * the current manifest uses this yet — no purchasable individual room-prop
   * item exists in the shop catalog today (store/shopStore.ts only sells
   * hair/outfit/accessory/background). The field exists so the mechanism is
   * ready and tested (roomThemeSupport.test.ts) before it's needed for real. */
  shopItemId?: string
  /** Position for a standalone prop file that isn't a full 640x800 canvas
   * layer, in canvas pixels from the top-left. Omitted for full-canvas
   * layers (they cover the whole frame via inset:0). */
  anchor?: { x: number; y: number }
  /** Rendered size in canvas pixels for a standalone prop file. Omitted for
   * full-canvas layers. */
  width?: number
  height?: number
}

/** Every real full-scene layer is authored at this resolution (2x the
 * legacy SVG room's 320x400 viewBox — same 4:5 aspect ratio, so the anchor
 * math below is a straight scale-up, not a redesign) and displayed at
 * whatever the responsive container size is via CSS, never at native
 * resolution. */
export const ROOM_CANVAS_WIDTH = 640
export const ROOM_CANVAS_HEIGHT = 800

/** CharacterView is not a room asset file — it's always mounted directly by
 * PixelRoomRenderer — but it still needs a place in the shared z-index
 * ladder so `behindCharacter` and `deskFront` layers stack correctly around
 * it. Every real layer's zIndex is authored relative to this constant. */
export const ROOM_CHARACTER_Z_INDEX = 20

/**
 * Character placement inside the room canvas (requirement #5: 방 높이의
 * 38~45% 차지, 남녀·모든 상태 공통 기준점). 0.42 sits in the middle of that
 * range. `CHARACTER_WIDTH_RATIO` converts the height-fraction into a
 * width-fraction for CharacterView's square (1:1) sprite canvas, correcting
 * for the room's 4:5 (width:height) aspect ratio — width% = heightRatio *
 * (canvasHeight / canvasWidth). This is a placement contract, not a design
 * decision made independently per theme: every theme must honor it so
 * gender/state switches never need a different anchor.
 */
export const CHARACTER_HEIGHT_RATIO = 0.42
export const CHARACTER_WIDTH_RATIO = CHARACTER_HEIGHT_RATIO * (ROOM_CANVAS_HEIGHT / ROOM_CANVAS_WIDTH)
/** Top offset as a fraction of room height. Low enough that the face (near
 * the top of the character's square canvas) clears the shelf/window layer
 * behind it, per requirement #5 "캐릭터 얼굴이 가장 먼저 보임". */
export const CHARACTER_TOP_RATIO = 0.16

/**
 * Hard upper bound on the character's height ratio, independent of any
 * caller-supplied `characterScale`. `CharacterRoomCard` (the Home screen)
 * passes `characterScale={1.3}` to `RoomScene` so the *legacy SVG* room's
 * unrelated `58% × scale` width formula reads as the screen's focal point —
 * but naively applying that same 1.3× to `CHARACTER_WIDTH_RATIO` here would
 * push the pixel room's character to 0.42 × 1.3 = 54.6% of room height,
 * blowing past the 38-45% PRD range this whole placement contract exists to
 * guarantee. `resolveCharacterHeightRatio`/`resolveCharacterWidthRatio`
 * clamp to this ceiling so any scale ≥ ~1.07 stops growing the character
 * further — LegacySvgRoomRenderer's own scale formula is untouched by this
 * (it doesn't import these ratios at all).
 */
export const MAX_CHARACTER_HEIGHT_RATIO = 0.45

/** `characterScale`-aware, clamped height ratio — the single place both
 * `PixelRoomRenderer` and `computeCharacterBoxPx` derive the character's
 * actual on-screen height fraction from, so the two can never disagree. */
export function resolveCharacterHeightRatio(characterScale = 1): number {
  return Math.min(CHARACTER_HEIGHT_RATIO * characterScale, MAX_CHARACTER_HEIGHT_RATIO)
}

/** Same clamp, expressed as the width fraction PixelRoomRenderer's CSS
 * actually sets (the square 1:1 sprite canvas means width ratio and height
 * ratio convert via the room's own 4:5 aspect ratio — see
 * CHARACTER_WIDTH_RATIO's derivation above). */
export function resolveCharacterWidthRatio(characterScale = 1): number {
  return resolveCharacterHeightRatio(characterScale) * (ROOM_CANVAS_HEIGHT / ROOM_CANVAS_WIDTH)
}

/**
 * `CharacterView`'s `size` prop is a max-width ceiling on a CSS-responsive
 * box (`width: 100%; max-width: size`), not a fixed pixel size — see
 * PixelSpriteRenderer.tsx / ChibiFallbackArt.tsx. PixelRoomRenderer passes
 * this constant instead of relying on CharacterView's small default (160px,
 * meant for non-room screens like MyPage), specifically so the ceiling
 * never binds before the real constraint (the room's own percentage width)
 * does — see `computeCharacterBoxPx` and roomAssetManifest.test.ts for the
 * regression guard proving this holds at every supported viewport width.
 */
export const ROOM_CHARACTER_SIZE_CAP = ROOM_CANVAS_WIDTH

/** PixelSpriteRenderer's canvas is square (public/sprites/avatar/base/ PNGs
 * are 160×160) — width:height. */
export const PNG_RENDERER_ASPECT_RATIO = 1
/** ChibiFallbackArt's `viewBox="0 0 200 240"` — width:height, a real 5:6
 * ratio, notably NOT square. This is exactly why PixelRoomRenderer can't
 * derive the character's box from a single "square canvas" width-ratio
 * formula (the bug fixed here) — it must size from HEIGHT, independent of
 * which renderer's aspect ratio ends up applying. */
export const SVG_RENDERER_ASPECT_RATIO = 200 / 240

/**
 * Pure math for the character's rendered box given a room container's
 * actual pixel width — used to verify the 38-45% height-ratio requirement
 * at real device widths (320/390/430) in tests, since this project has no
 * component-rendering test harness to measure real CSS layout. Mirrors
 * exactly what CharacterView's `fit="height"` mode does in real CSS
 * (PixelSpriteRenderer.tsx / ChibiFallbackArt.tsx, both driven from
 * PixelRoomRenderer's height-based wrapper): height is derived purely from
 * `resolveCharacterHeightRatio` (clamped, aspect-ratio-independent); width
 * is then derived FROM that height via whichever renderer's own aspect
 * ratio is passed in — defaults to the PNG renderer's 1:1 for backward
 * compatibility with existing callers of this function.
 */
export function computeCharacterBoxPx(
  roomWidthPx: number,
  characterScale = 1,
  aspectRatio: number = PNG_RENDERER_ASPECT_RATIO,
): { widthPx: number; heightPx: number; heightRatio: number } {
  const roomHeightPx = roomWidthPx * (ROOM_CANVAS_HEIGHT / ROOM_CANVAS_WIDTH)
  const heightRatio = resolveCharacterHeightRatio(characterScale)
  const heightPx = roomHeightPx * heightRatio
  const widthPx = heightPx * aspectRatio
  return { widthPx, heightPx, heightRatio }
}

function assetPath(theme: RoomThemeId, file: string): string {
  return `/sprites/room/${theme}/${file}`
}

/**
 * The 14-file `default-night` layer set (requirement #2), grouped and
 * z-ordered per the 6-stage pipeline. `minLevel` on plant/cat mirrors the
 * exact thresholds already used by the SVG room's GROWTH_STAGES (level 10 /
 * 20) so switching renderers never changes when furniture unlocks. None of
 * these files exist on disk yet (see roomThemeSupport.ts
 * CONFIRMED_ROOM_LAYER_IDS) — declaring the path here does not activate
 * anything.
 */
export const ROOM_ASSET_MANIFEST: Record<RoomThemeId, RoomLayerAsset[]> = {
  'default-night': [
    { id: 'background', group: 'background', src: assetPath('default-night', 'background.png'), zIndex: 0 },

    { id: 'rug', group: 'behindCharacter', src: assetPath('default-night', 'rug.png'), zIndex: 9 },
    { id: 'window-night', group: 'behindCharacter', src: assetPath('default-night', 'window-night.png'), zIndex: 10 },
    { id: 'shelf', group: 'behindCharacter', src: assetPath('default-night', 'shelf.png'), zIndex: 11 },
    { id: 'desk-back', group: 'behindCharacter', src: assetPath('default-night', 'desk-back.png'), zIndex: 12 },

    { id: 'desk-front', group: 'deskFront', src: assetPath('default-night', 'desk-front.png'), zIndex: 30 },
    { id: 'lamp', group: 'deskFront', src: assetPath('default-night', 'lamp.png'), zIndex: 31 },
    { id: 'books', group: 'deskFront', src: assetPath('default-night', 'books.png'), zIndex: 32 },
    { id: 'mug', group: 'deskFront', src: assetPath('default-night', 'mug.png'), zIndex: 33 },
    { id: 'stationery', group: 'deskFront', src: assetPath('default-night', 'stationery.png'), zIndex: 34 },

    { id: 'plant', group: 'foreground', src: assetPath('default-night', 'plant.png'), zIndex: 40, minLevel: 10 },
    { id: 'cat', group: 'foreground', src: assetPath('default-night', 'cat.png'), zIndex: 41, minLevel: 20 },
    { id: 'foreground', group: 'foreground', src: assetPath('default-night', 'foreground.png'), zIndex: 42 },

    { id: 'lamp-glow', group: 'lighting', src: assetPath('default-night', 'lamp-glow.png'), zIndex: 50 },
  ],
}
