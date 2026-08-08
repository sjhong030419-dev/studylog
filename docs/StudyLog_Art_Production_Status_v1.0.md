# StudyLog Art Production Status

**Version:** 1.0  
**Updated:** 2026-08-08  
**Runtime policy:** Never activate an incomplete or visually incompatible set.

## Default-night room

- 16/16 manifest PNG files delivered at 640 × 800 RGBA.
- Background, window, shelf, rug, chair, two desk-state layers, lamp, books,
  mug, stationery, level-10 plant, level-20 cat, foreground, lamp glow, and
  the reserved shop prop slot are present.
- Source/chroma files live in `docs/assets/room-layer-sources/v1/`.
- Reviewed composite:
  `docs/assets/room-layer-drafts/v1/preview-background-furniture-v1.png`.
- `CONFIRMED_ROOM_LAYER_IDS.default-night` lists all 16 verified layers.
- Runtime activation remains intentionally blocked by
  `ROOM_AVATAR_COMPOSITION_READY = false` because the legacy study avatar has
  its old desk baked into the sprite.

## Avatar cosmetics

- Approved visual direction covers the lavender hoodie and ribbon, round
  glasses, lavender headphones, cream knit, pink pajama cardigan, and star
  hairpin.
- The first real `girl/study` vertical slice now includes a bare base,
  default hair, default outfit, lavender hoodie, ribbon, glasses, and
  headphones on the shared 160 × 160 anchor.
- Production files live under `public/sprites/avatar-layers/`; reviewed
  standalone and room composites live under
  `docs/assets/cosmetic-drafts/v2/girl/study/`.
- These files remain unregistered because a partial state/gender set must not
  make equipped cosmetics disappear when users switch state.
- Blocking requirement: adapt the locked geometry to `idle`, `sleep`, and
  `happy`, then complete the boy set before enabling runtime support.

## Activation checklist

1. Treat the completed `girl/study` vertical slice as the geometry master.
2. Complete `idle`, `sleep`, and `happy` using the same identity and anchors.
3. Complete the equivalent boy layers, then register only full asset keys.
4. Flip `ROOM_AVATAR_COMPOSITION_READY` to `true`.
5. Test Home, Timer, and capture card at 320, 390, and 430 px widths in
   `idle`, `study`, `sleep`, and `happy` states.
6. Expand the locked geometry to remaining states and the boy avatar.

## Verification completed

- Unit tests: 284 passed.
- Lint: passed.
- TypeScript + production build: passed.
- Room files: 16 valid, 0 invalid.
- Expected first-slice files: 22 valid total (16 room + 6 avatar), 0 invalid.
- Additional study accessories delivered: glasses and headphones.
- Remaining expected avatar files: 42, intentionally inactive.
