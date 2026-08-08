# StudyLog Art Production Status

**Version:** 1.1  
**Updated:** 2026-08-08  
**Runtime policy:** Never activate an incomplete or visually incompatible set.

## Default-night room

- 18/18 manifest PNG files are delivered at 640 x 800 RGBA.
- The set includes background, window, shelf, rug, chair, two desk-state
  layers, lamp, books, mug, stationery, plant, cat, foreground, lamp glow,
  the reserved shop prop, and study-only notebook and hand layers.
- Source/chroma files live in `docs/assets/room-layer-sources/v1/` and `v2/`.
- The reviewed composite is
  `docs/assets/room-layer-drafts/v1/preview-background-furniture-v1.png`.
- `CONFIRMED_ROOM_LAYER_IDS.default-night` lists all 18 verified layers.
- Runtime activation remains intentionally blocked by
  `ROOM_AVATAR_COMPOSITION_READY = false` until all character states share
  the locked geometry.

## Avatar cosmetics

- Approved visual direction covers the lavender hoodie and ribbon, round
  glasses, lavender headphones, cream knit, pink pajama cardigan, and star
  hairpin.
- The real `girl/study` vertical slice includes a bare base, default hair,
  default outfit, lavender hoodie, ribbon, glasses, and headphones on the
  shared 160 x 160 anchor.
- The study pose uses a notebook behind a dedicated writing-hand layer. The
  left hand grips the pencil and the right hand rests on the page. Both stay
  behind `desk-front-study`, preventing desk/avatar overlap.
- The duplicated brown neckline captured in the hair source was removed and
  both hands were normalized to the approved chibi proportions.
- Production files live under `public/sprites/avatar-layers/`; reviewed
  standalone and room composites live under
  `docs/assets/cosmetic-drafts/v2/girl/study/`.
- These avatar files remain unregistered because a partial state/gender set
  must not make equipped cosmetics disappear when users switch state.

## Activation checklist

1. Treat the completed `girl/study` slice as the geometry master.
2. Complete `idle`, `sleep`, and `happy` with the same identity and anchors.
3. Complete the equivalent boy layers, then register only full asset keys.
4. Flip `ROOM_AVATAR_COMPOSITION_READY` to `true`.
5. Test Home, Timer, and capture at 320, 390, and 430 px widths in every state.
6. Expand the locked geometry to remaining states and avatar options.

## Verification target

- Room files: 18 valid at 640 x 800 RGBA.
- First-slice files: 24 valid total (18 room + 6 avatar), 0 invalid.
- Remaining expected avatar files: 42, intentionally inactive.
- Unit tests: 284 passed.
- Lint: passed.
- TypeScript and production build: passed.
