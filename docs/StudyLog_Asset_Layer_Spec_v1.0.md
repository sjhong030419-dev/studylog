# StudyLog Layered Avatar & Room Asset Specification

**Version:** 1.0  
**Status:** Production-art contract  
**Canvas:** Room layers 640 × 800 px, RGBA. Avatar layers 160 × 160 px, RGBA (settled — see §5; not the same canvas as room layers, by design).  
**Related PRD:** `docs/StudyLog_Cosmetic_System_PRD_v1.0.md`

---

## 1. Purpose

This specification defines how artists and engineers create interchangeable avatar clothing, accessories, furniture, props, and room themes that still look like one coherent illustration.

Every asset must align without screen-specific offsets. Home, Timer, Capture, Profile, and Shop must consume the same source assets or deterministic derivatives.

---

## 2. Non-negotiable Rules

- Room master canvas: exactly `640 × 800` pixels.
- Avatar layer canvas: exactly `160 × 160` pixels (settled — see §5 for why this is a deliberately separate, smaller canvas from the room's).
- Color mode: sRGB.
- Format: transparent PNG (`RGBA`) for layers.
- No white matte, cropped bounding box, or automatic trim.
- Every full-canvas room layer keeps the complete 640 × 800 canvas, even if only a small region is painted. Every avatar layer keeps the complete 160 × 160 canvas the same way.
- Nearest-neighbor scaling only for pixel-art assets.
- No CSS recoloring of production illustrations unless an item was explicitly authored for tinting.
- Fixed anchor points and z-order; no per-screen manual adjustment.
- No item ID conditionals inside React renderers.
- The approved full-scene image is a visual reference/fallback, not a customizable asset.

---

## 3. Scene Coordinate Contract

Use the existing room contract:

- `ROOM_CANVAS_WIDTH = 640`
- `ROOM_CANVAS_HEIGHT = 800`
- `ROOM_CHARACTER_Z_INDEX = 20`
- Character height target: 38–45% of room height
- Existing character top/width ratios remain the engineering source of truth until deliberately versioned

All art should use one shared template containing:

- Canvas edge
- Character center line
- Character head center
- Eye line
- Neck point
- Shoulder line
- Hand/pencil anchors per state
- Seat point
- Desk-front occlusion line
- Floor line
- Pet anchor
- Desk-prop safe zones

The template guide layer is never exported.

---

## 4. Render Order

Recommended z-index bands:

| Z range | Layer |
|---:|---|
| 0–9 | Room background, wall, window, floor |
| 10–19 | Rear furniture, shelf, chair back, rear props |
| 20–27 | Avatar back hair/body base |
| 28–34 | Outfit/body overlays |
| 35–44 | Avatar front hair and held study tool |
| 45–59 | Head accessories |
| 60–69 | Face accessories and expressions |
| 70–79 | Desk front and foreground furniture |
| 80–89 | Desk-top props that must overlap the avatar |
| 90–99 | Pet foreground, particles, lighting overlays |

The existing room manifest uses its own current values. Before implementation, reconcile the exact numbers once in the manifest; do not duplicate conflicting constants across catalogs.

---

## 5. Avatar Layer Slots

**Canvas: 160 × 160 px, RGBA — not the room's 640 × 800.** Settled decision,
not open: the avatar is an independent, reusable image positioned inside
the room at runtime via `CHARACTER_HEIGHT_RATIO`/`CHARACTER_TOP_RATIO`
(`src/character/room/roomAssetManifest.ts`) — the same approach the
existing, already-shipped base sprite
(`public/sprites/avatar/base/{gender}_{state}_{frame}.png`, also
160 × 160) already uses successfully at 320–430px. The character is never
pre-composited into the full 640 × 800 room canvas by the artist. This
keeps art production tractable — one reusable avatar per state/gender/item,
not a hand-aligned full-scene composite for every combination — and matches
the file paths under `public/sprites/avatar-layers/` that
`src/character/engine/spriteManifest.ts`'s `resolveCosmeticLayerPath` /
`resolveBareBaseFramePath` already generate.

```text
avatar/base/{gender}/{state}.png
avatar/hair-back/{assetKey}/{gender}/{state}.png
avatar/outfit/{assetKey}/{gender}/{state}.png
avatar/hair-front/{assetKey}/{gender}/{state}.png
avatar/head-accessory/{assetKey}/{gender}/{state}.png
avatar/face-accessory/{assetKey}/{gender}/{state}.png
avatar/expression/{expression}/{gender}/{state}.png
```

Gender in a path means body/preset compatibility, not a restriction on who may equip an item. Shared art may use `unisex` and resolve before rendering.

### Required states

- `idle`
- `study`
- `sleep`
- `happy`

### Expression and state

State controls pose; expression controls face. Do not bake every expression into every outfit. If the current base art prevents this separation, keep expressions state-baked for MVP and document that limitation explicitly.

### Outfit coverage

An outfit must cover the same body regions in all states and must not erase hands, face, hair, or held tools unless intentionally designed to overlap them.

---

## 6. Room Layer Slots

```text
room/{theme}/background.png
room/{theme}/window.png
room/{theme}/wall-decor.png
room/{theme}/shelf.png
room/{theme}/chair-back.png
room/{theme}/desk-back.png
room/{theme}/desk-front.png
room/{theme}/desk-front-study.png
room/{theme}/lighting.png

room-items/desk/{assetKey}.png
room-items/chair/{assetKey}.png
room-items/lamp/{assetKey}.png
room-items/desk-prop/{assetKey}.png
room-items/pet/{assetKey}/{state}.png
```

Reuse the existing `excludeStates`/`onlyStates` mechanism for `desk-front` versus `desk-front-study`. Never show two desk fronts simultaneously.

Full-canvas room layers use no anchor. Standalone props must declare:

- Anchor `x`, `y`
- Rendered width and height
- Z-index
- Compatible themes
- Compatible states, if restricted

---

## 7. Filename and ID Rules

- Lowercase kebab-case only.
- Item IDs and asset keys are stable identifiers, not Korean display names.
- No spaces, dates, `final`, `new`, or version words in filenames.
- Revised art replaces the asset at a versioned catalog/manifest boundary; browser cache invalidation must be considered.
- Never rename a released item ID merely to match a new filename.

Example:

```text
item id: outfit-purple-hoodie
asset key: purple-hoodie
file: avatar/outfit/purple-hoodie/unisex/study.png
```

---

## 8. Pixel-Art Style Guide

- Match the approved avatar and room's pixel density, outline weight, palette temperature, and lighting direction.
- Use a consistent virtual pixel grid across every layer.
- Hard edges must land on the pixel grid; do not use antialiased vector scaling.
- Preserve the cozy warm-light / cool-night contrast.
- Avoid mixing emoji, flat vector icons, high-resolution painted props, or mismatched pixel densities in the final scene.
- Clothing folds and accessory detail must remain readable at a 320 px-wide capture.
- Test actual mobile size, not only a zoomed artboard.

---

## 9. Occlusion and Collision Rules

- Hair back renders behind the face and outfit.
- Hair front renders above the forehead but must not hide eyes by default.
- Glasses align to the eye anchor for every required state.
- Headwear must declare whether it replaces or overlays hair front.
- Desk front hides the correct lower-body region without cutting hands or sleeves.
- Study-state pencil/book art must have exactly one owner: avatar state layer or room layer, never both.
- A lamp or desk prop must not cover the face or primary writing hand.
- Pet safe zones must not overlap timer text or capture metadata.
- Lighting overlays use transparent blending and must not materially change skin/outfit identification.

---

## 10. Asset Manifest Requirements

Each production asset must be registered in data with at least:

```ts
interface LayerAssetDefinition {
  itemId?: string
  assetKey: string
  slot: string
  src: string
  zIndex: number
  state?: CharacterState
  gender?: 'female' | 'male' | 'unisex'
  anchor?: { x: number; y: number }
  width?: number
  height?: number
  onlyStates?: CharacterState[]
  excludeStates?: CharacterState[]
  compatibleThemes?: string[]
  critical?: boolean
}
```

Rules:

- Manifest defines possible assets.
- A confirmed-support registry defines assets that physically exist and passed QA.
- UI must not request unconfirmed paths.
- Baseline critical-layer failure falls back to the safe legacy/full-scene renderer.
- Optional cosmetic failure falls back for that slot without changing ownership/equipment.

---

## 11. Thumbnail Generation

Shop thumbnails must represent the actual asset.

Preferred process:

1. Render the item on the default compatible avatar or room.
2. Use a deterministic neutral preview background.
3. Crop through a shared thumbnail template, not manual per-item CSS.
4. Export WebP/PNG thumbnails at defined 1× and 2× sizes.
5. Never use emoji as the production preview for a pixel-art cosmetic.

Suggested sizes:

- Character item card: 256 × 256
- Room theme card: 320 × 240
- Reward reveal: 384 × 384

---

## 12. Animation Contract

MVP may animate layers with subtle transforms when separate frame animation is unavailable:

- Blink
- Pencil movement
- Mug steam
- Lamp glow
- Pet tail
- Small completion bounce

Rules:

- Static capture always uses a deterministic frame.
- Reduced-motion mode disables nonessential loops.
- Accessories follow the same transform origin as the attached body anchor.
- Animation must not cause independent clothing drift.
- If frame-based animation is added, every attached cosmetic must share frame count, dimensions, and timing or use explicit anchor metadata per frame.

---

## 13. Export Checklist for Artists

For every new item:

- [ ] Correct master canvas used — 640 × 800 for a room layer, 160 × 160 for an avatar layer (§2, §5)
- [ ] Transparent background preserved
- [ ] Canvas not trimmed
- [ ] Pixel grid and palette match approved art
- [ ] Required genders/presets supported or marked unisex
- [ ] All required states supplied
- [ ] Eye/neck/hand/seat anchors align
- [ ] Correct z-order documented
- [ ] No double-owned book, pencil, desk, or chair element
- [ ] Thumbnail supplied/generated
- [ ] File size reviewed
- [ ] Asset key and item ID match catalog registration

---

## 14. Engineering Validation

Automated:

- Verify dimensions and RGBA mode for all registered PNGs.
- Verify every confirmed asset exists.
- Verify no duplicate item ID, asset key, slot conflict, or invalid z-index.
- Verify required-state completeness for purchasable character items.
- Verify default item exists for every required slot.
- Verify room state gates resolve to exactly one active desk-front layer.

Manual matrix:

| Dimension | Values |
|---|---|
| Width | 320, 375, 390, 430 px |
| State | idle, study, sleep, happy |
| Preset | female, male |
| Capture | square, 9:16 |
| Motion | normal, reduced |

Inspect:

- Face visibility
- Hair/hat/glasses alignment
- Hands, pencil, and sleeves
- Desk/body occlusion
- Prop and pet collisions
- Lighting consistency
- Pixel sharpness
- Capture clipping

---

## 15. Initial Production Delivery

Do not request a large catalog first. Deliver this vertical slice:

1. One default layered room matching the approved full-scene reference
2. One default avatar per current preset/gender
3. Four required states
4. One alternate hair
5. One alternate outfit
6. One head accessory
7. One face accessory
8. One desk prop
9. One lamp variant
10. One pet

The vertical slice is accepted only when each equipped item appears consistently in Home, Timer, square capture, and story capture.

---

## 16. Definition of Done

The asset system is production-ready when:

- New cosmetics can be added by exporting files and registering data.
- No renderer needs an item-specific code branch.
- All layers align across required states and supported mobile sizes.
- Equipped room and avatar items appear in captures.
- Missing assets degrade safely without data loss.
- The scene preserves the visual quality of the approved full illustration.
- Art and engineering validation checklists pass.

