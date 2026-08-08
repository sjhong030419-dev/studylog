# StudyLog — First Vertical Slice Asset Request

**Audience:** artist / image-generation pipeline
**Status:** requesting production files — nothing below exists yet
**Related specs:** `docs/StudyLog_Cosmetic_System_PRD_v1.0.md`, `docs/StudyLog_Asset_Layer_Spec_v1.0.md`, `docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md`, `docs/StudyLog_Phase2_CrossScreen_Consistency_Plan.md`

---

## 0. What this slice is for

This is the smallest set of real files needed for the layered room +
character renderer (`PixelRoomRenderer` + `PixelSpriteRenderer`) to become
fully correct: the baseline room, a bare avatar with its own default
hair/outfit, one full outfit swap, one head accessory, and one desk prop —
at every required character state, on both genders, with no double-desk or
double-outfit artifacts.

**This does not by itself change what Home, Timer, or Capture show.** All
three currently render the full-scene illustration (`FullSceneRoomRenderer`)
— see `docs/StudyLog_Phase2_CrossScreen_Consistency_Plan.md` for exactly why
and what additional (still unimplemented) code change is needed before any
of these files becomes visible on those screens. Delivering these files is
a prerequisite for that switch, not a replacement for it.

**Do not deliver a partial state/gender for any single item.** Every group
in §2 must land completely together — a hairstyle with 3 of 4 states
supplied does not activate (see §4 "Activation procedure").

---

## 1. Canvas & style baseline (settled — both sizes are final)

- **Room layers: 640×800px**, RGBA, transparent background, nearest-neighbor
  pixel-art scaling (`docs/StudyLog_Asset_Layer_Spec_v1.0.md` §2).
- **Avatar layers: 160×160px**, RGBA, transparent background — the same
  resolution as the existing, already-shipped base sprite
  (`public/sprites/avatar/base/`). The avatar is a small, independent,
  reusable image positioned inside the room at runtime
  (`CHARACTER_HEIGHT_RATIO`/`CHARACTER_TOP_RATIO` in
  `src/character/room/roomAssetManifest.ts`), never pre-composited into the
  full 640×800 room canvas by the artist. See
  `docs/StudyLog_Asset_Layer_Spec_v1.0.md` §5 for the full reasoning — this
  was previously listed as an open decision; it is now the settled contract
  in both documents.
- Match the existing approved character sheet's pixel density, outline
  weight, palette temperature, and lighting direction
  (`docs/character-system.md`, `docs/assets/study-room-approved-v2.png`).
- No white matte, no cropped/trimmed canvas — every file keeps its full
  declared dimensions even where mostly transparent.

---

## 2. File list

### 2a. Room baseline (15 files — NOT yet delivered, despite being fully specified)

`docs/StudyLog_Pixel_Room_Asset_Spec_v1.0.md` defines these in full detail
(z-index, transparency rules, palette). They are listed again here only as
a completeness check: **none of these 15 files exist on disk yet either.**
`src/character/room/roomThemeSupport.ts`'s `CONFIRMED_ROOM_LAYER_IDS` is
still empty, and `public/sprites/room/default-night/` does not contain them.

| File | Notes |
|---|---|
| `public/sprites/room/default-night/background.png` | |
| `public/sprites/room/default-night/rug.png` | |
| `public/sprites/room/default-night/window-night.png` | |
| `public/sprites/room/default-night/shelf.png` | |
| `public/sprites/room/default-night/desk-back.png` | |
| `public/sprites/room/default-night/desk-front.png` | all states except `study` |
| `public/sprites/room/default-night/desk-front-study.png` | `study` only — avoids double-desk with the study base sprite's baked-in desk |
| `public/sprites/room/default-night/lamp.png` | |
| `public/sprites/room/default-night/books.png` | |
| `public/sprites/room/default-night/mug.png` | |
| `public/sprites/room/default-night/stationery.png` | |
| `public/sprites/room/default-night/plant.png` | Lv10 unlock |
| `public/sprites/room/default-night/cat.png` | Lv20 unlock |
| `public/sprites/room/default-night/foreground.png` | |
| `public/sprites/room/default-night/lamp-glow.png` | |

**15 files, all required together** — `PixelRoomRenderer` does not activate
for `default-night` until every one of these (the level-gated plant/cat
excepted) is confirmed present.

### 2b. Bare avatar base (NEW — replaces nothing existing)

The current base sprites (`public/sprites/avatar/base/{gender}_{state}_{frame}.png`)
already have default hair and outfit painted in and **stay exactly as they
are** — they remain the live fallback. This is a *second*, additive base: a
bare body with no hair or outfit, so a real outfit swap can cleanly replace
the default instead of stacking on top of it.

| File | Gender | State |
|---|---|---|
| `public/sprites/avatar-layers/base/boy/idle.png` | boy | idle |
| `public/sprites/avatar-layers/base/boy/study.png` | boy | study |
| `public/sprites/avatar-layers/base/boy/sleep.png` | boy | sleep |
| `public/sprites/avatar-layers/base/boy/happy.png` | boy | happy |
| `public/sprites/avatar-layers/base/girl/idle.png` | girl | idle |
| `public/sprites/avatar-layers/base/girl/study.png` | girl | study |
| `public/sprites/avatar-layers/base/girl/sleep.png` | girl | sleep |
| `public/sprites/avatar-layers/base/girl/happy.png` | girl | happy |

**8 files, all required together** (both genders × all 4 states) before the
bare base can activate for either gender.

### 2c. Default hair (NEW — the bare base's default look)

Two layer pieces per gender × state (hair drawn behind vs. in front of the
face/outfit).

| File | Gender | State |
|---|---|---|
| `public/sprites/avatar-layers/hair-back/default-hair/boy/{idle,study,sleep,happy}.png` | boy | all 4 |
| `public/sprites/avatar-layers/hair-front/default-hair/boy/{idle,study,sleep,happy}.png` | boy | all 4 |
| `public/sprites/avatar-layers/hair-back/default-hair/girl/{idle,study,sleep,happy}.png` | girl | all 4 |
| `public/sprites/avatar-layers/hair-front/default-hair/girl/{idle,study,sleep,happy}.png` | girl | all 4 |

**16 files** (2 layer pieces × 2 genders × 4 states), all required together.

### 2d. Default outfit (NEW — the bare base's default look)

| File | Gender | State |
|---|---|---|
| `public/sprites/avatar-layers/outfit/default-outfit/boy/{idle,study,sleep,happy}.png` | boy | all 4 |
| `public/sprites/avatar-layers/outfit/default-outfit/girl/{idle,study,sleep,happy}.png` | girl | all 4 |

**8 files**, all required together.

### 2e. Swap outfit — existing item `outfit-blue` ("파란 니트")

Already a real, purchasable, ownable shop item — some users may already own
it. `assetKey` is `hoodie` (`character/catalog/items.ts`, unchanged by this
request).

| File | Gender | State |
|---|---|---|
| `public/sprites/avatar-layers/outfit/hoodie/boy/{idle,study,sleep,happy}.png` | boy | all 4 |
| `public/sprites/avatar-layers/outfit/hoodie/girl/{idle,study,sleep,happy}.png` | girl | all 4 |

**8 files**, all required together. (If one file set — say `unisex` — can
cover both genders without looking wrong, deliver
`public/sprites/avatar-layers/outfit/hoodie/unisex/{state}.png` instead —
4 files. Confirm with engineering before doing this; see §4.)

### 2f. Head accessory — existing item `hair-ribbon` ("리본 헤어핀")

Already real/purchasable. `assetKey` is `ribbon`.

| File | Gender | State |
|---|---|---|
| `public/sprites/avatar-layers/head-accessory/ribbon/boy/{idle,study,sleep,happy}.png` | boy | all 4 |
| `public/sprites/avatar-layers/head-accessory/ribbon/girl/{idle,study,sleep,happy}.png` | girl | all 4 |

**8 files**, all required together. (Same `unisex` note as 2e applies if a
ribbon genuinely looks identical on both presets.)

### 2g. Desk prop — new, not yet purchasable (`desk-prop-plant-pot`, working name)

Full-canvas **640×800** room layer (matches every other room layer in §2a —
most of that set's "props" like the mug and stationery are also full-canvas
files, not small anchored crops, for consistency).

| File | Notes |
|---|---|
| `public/sprites/room/default-night/desk-prop-plant-pot.png` | Sits on the desk surface, in front of the character's hands/desk area (z-index 35 — see §3). Gender/state-independent (one file covers every combination). |

**1 file.**

### Total: 64 files

| Group | Count |
|---|---:|
| Room baseline (§2a) | 15 |
| Bare avatar base (§2b) | 8 |
| Default hair (§2c) | 16 |
| Default outfit (§2d) | 8 |
| Swap outfit `hoodie` (§2e) | 8 |
| Head accessory `ribbon` (§2f) | 8 |
| Desk prop (§2g) | 1 |
| **Avatar subtotal (§2b–2f)** | **48** |
| **Room subtotal (§2a + §2g)** | **16** |
| **Total** | **64** |

`npm run validate:assets` (`scripts/validateLayerAssets.ts`, already
implemented) checks for exactly these 64 files and validates each one's
dimensions and RGBA mode once present — see §4.

---

## 3. Z-index / stacking (already implemented, listed for reference)

Room layers (`src/character/room/roomAssetManifest.ts`, unchanged numbering
except the new row):

| id | group | z-index |
|---|---|---:|
| background | background | 0 |
| rug | behindCharacter | 9 |
| window-night | behindCharacter | 10 |
| shelf | behindCharacter | 11 |
| desk-back | behindCharacter | 12 |
| **(character)** | — | **20** |
| desk-front-study | deskFront | 29 |
| desk-front | deskFront | 30 |
| lamp | deskFront | 31 |
| books | deskFront | 32 |
| mug | deskFront | 33 |
| stationery | deskFront | 34 |
| **desk-prop-plant-pot (new)** | **deskFront** | **35** |
| plant (Lv10) | foreground | 40 |
| cat (Lv20) | foreground | 41 |
| foreground | foreground | 42 |
| lamp-glow | lighting | 50 |

Avatar layers (`src/character/engine/spriteManifest.ts` `SPRITE_LAYER_ORDER`,
back → front, unchanged): `base → skin → eyes → mouth → hairBack → outfit →
hairFront → accessory (head/face/neck) → handheld → stateEffect`.

---

## 4. Activation procedure (engineering does this once files are approved)

1. Place every file at the exact path in §2.
2. Run `npm run validate:assets` (`scripts/validateLayerAssets.ts`, already
   implemented and unit-tested against synthetic PNG headers —
   `scripts/pngLayerValidation.ts`). It reports missing files and validates
   dimensions/RGBA mode for anything present. Not part of `npm run test`/
   `build`/`lint` — run it manually as a readiness check.
3. Add to `src/character/engine/spriteSupport.ts`:
   - `BARE_BASE_CONFIRMED_GENDERS`: add `'boy'`, `'girl'` (only once §2b AND
     §2c AND §2d are ALL real for both genders — a bare base with no default
     hair/outfit would show an undressed character).
   - `SUPPORTED_COSMETIC_ASSET_KEYS`: add `'default-hair'`, `'default-outfit'`,
     `'hoodie'`, `'ribbon'` (each only once its own full gender×state set is
     real).
4. Add to `src/character/room/roomThemeSupport.ts`'s
   `CONFIRMED_ROOM_LAYER_IDS['default-night']`: the 15 baseline ids from §2a
   — this is what turns on `PixelRoomRenderer` at all, a prerequisite for
   the desk prop (or any cosmetic) to ever matter.
5. To make `desk-prop-plant-pot` purchasable: add a real entry to
   `store/shopStore.ts`'s `SHOP_ITEMS` with `id: 'desk-prop-plant-pot'`, then
   add `'desk-prop-plant-pot'` to `CONFIRMED_ROOM_LAYER_IDS['default-night']`.
   This is a product decision (price, category, name) — not made by this
   request.
6. **Separately, and only after steps 1–5 are done:** switch Home, Timer,
   and Capture to actually show the layered renderer instead of the
   full-scene illustration — this is a distinct code change described in
   `docs/StudyLog_Phase2_CrossScreen_Consistency_Plan.md` §3, not automatic
   once files land. It is not part of this asset request.
7. Verify at 320/375/390/430px, both genders, all 4 states, square + 9:16
   capture (`docs/StudyLog_Asset_Layer_Spec_v1.0.md` §14 manual matrix).

Until every step for a given piece is done, nothing changes on screen — the
existing baked-in-default base and the existing full-scene Timer/Home/Capture
illustration keep rendering exactly as today.
