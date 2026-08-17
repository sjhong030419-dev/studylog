# StudyLog Sakura Uniform Skin PRD v1.0

**Status:** Concept approved for review; production sprites not yet delivered

**Skin ID:** `skin-sakura-uniform-girl`

**Product role:** First collectible complete-look skin after the black-hair vertical slice

## 1. Product intent

Introduce one emotionally distinctive reward without reopening the unstable runtime layer-composition approach. The item should feel collectible, immediately visible, and suitable for Home, Timer, Profile, Shop, and Capture/Share.

This is a **complete whole-avatar skin preset**, not separate clothing, ribbon, hair, or accessory layers.

## 2. Visual source of truth

- `docs/assets/skin-concepts/sakura-uniform-v1/girl-idle-concept.png`
- `docs/assets/skin-concepts/sakura-uniform-v1/girl-study-concept.png`

These are high-resolution **design references only**. They must not be copied directly into `public/` or downscaled as production sprites. Production assets must preserve the geometry of the existing 160×160 base frames.

## 3. Locked design

- Existing StudyLog girl identity, brown bob hair, face, eyes, skin tone, and chibi proportions
- Soft cream sailor blouse
- Muted dusty-sakura collar and ribbon
- Warm charcoal pleated skirt where the pose exposes it
- Cream socks and dusty-sakura loafers in full-body states
- Existing blue-gray hair clip retained, with one subtle sakura accent
- Warm, cozy, studious mood; no fantasy armor or excessive decoration

Recommended palette:

| Token | Hex | Usage |
|---|---:|---|
| Sakura | `#C97886` | collar, ribbon, shoes |
| Sakura light | `#E7A6AF` | highlights, flower |
| Cream | `#F7EBDD` | blouse, socks |
| Charcoal | `#4B454A` | skirt and dark accents |
| Outline brown | `#4A2C28` | preserve base outline language |

## 4. Identity invariants

For every state and frame, production art must retain the corresponding base sprite's:

- 160×160 RGBA canvas
- transparent background
- character position and bounding box
- face geometry and expression
- hair silhouette and color
- hands, limbs, pose, desk, pencil, book, and props
- pixel density, outline weight, and shading language

Only clothing pixels and the small hair ornament may change. Do not regenerate the whole character independently per frame.

## 5. Required coverage

Girl only for v1. Use the existing `STATE_FRAME_COUNT`, `STATE_FILE_NAME`, and zero-padded frame convention. The complete family is 104 PNGs across all 13 states:

- idle
- study
- thinking
- reading
- typing
- break
- sleep
- happy
- excited
- celebrate
- levelUp (`levelup` in filenames)
- focused
- away

Target path:

```text
public/sprites/avatar/whole/sakura-uniform/girl_{state}_{frame}.png
```

Example:

```text
girl_idle_01.png
girl_study_01.png
girl_levelup_12.png
```

Do not register the skin until all 104 files pass validation and visual review.

## 6. Commerce and progression

- Shop category: `skin`
- Display name: `벚꽃 교복 학생`
- Recommended MVP price: `120P`
- Cosmetic only; no Study XP, focus, or ranking advantage
- Purchase does not reduce lifetime Study XP or character level
- Girl-only availability must be disclosed before purchase
- Boy users must not be allowed to spend points until boy assets exist

This item must be mutually exclusive with other whole-avatar skins. Existing ownership remains stored when switching gender or skin.

## 7. Architecture rule

Do not model this item as four independent cosmetics. Register it as one complete whole-avatar variant requiring only `skin-sakura-uniform-girl`.

Variant priority must be deterministic:

1. Explicit complete skin preset
2. Complete multi-item baked variant
3. Complete single-item variant such as black hair
4. Default base avatar
5. SVG emergency fallback

Equipping this skin should visually override black hair and unsupported ribbon/outfit selections while preserving their ownership data. Unequipping the skin restores the best supported underlying appearance.

## 8. Loading fallback

```text
Sakura skin PNG
→ best supported underlying whole-avatar PNG
→ default base PNG
→ SVG emergency fallback
```

A missing skin frame must never immediately switch the entire character to SVG.

## 9. Cross-screen acceptance criteria

The same equipped skin must appear in:

- Home
- normal Timer
- Pomodoro
- Shop preview
- Profile
- Realtime room for the current user
- Capture/Share preview
- generated square PNG
- generated 9:16 PNG

It must survive reload and browser restart.

## 10. Art QA gate

Before code registration:

- 104/104 files exist
- every file is 160×160 RGBA PNG
- no baked checkerboard or opaque background
- no face drift between frames
- no character-position jitter
- hands and desk do not change shape
- clothing edges do not flicker across animation frames
- idle, study, sleep, happy, and level-up contact sheets are visually approved

## 11. Engineering verification

- Asset validator reports 104 valid, 0 missing, 0 invalid for this family
- Variant resolver tests cover all states and frames
- girl + skin resolves to sakura paths
- boy + skin request never resolves to a missing path
- skin overrides black hair deterministically
- unequipping skin restores black hair if it was equipped
- image failure follows the fallback chain
- persistence survives old localStorage shapes
- full tests, lint, TypeScript, production build, and `git diff --check` pass

## 12. Explicit non-goals

- No independent mix-and-match ribbon, blouse, skirt, or shoes in this release
- No boy version without a separately approved complete asset family
- No automatic downscaling of the concept images
- No runtime recoloring
- No return to partial avatar-layer compositing
- No bulk registration before visual QA

## 13. Implementation order

1. Approve the two concept references
2. Produce one exact 160×160 `idle_01` proof from the base frame
3. Produce one exact 160×160 `study_01` proof from the base frame
4. Compare proofs over the originals for geometry drift
5. Produce and visually review all 104 frames
6. Add a dedicated asset validator family
7. Register the shop item and whole-avatar variant
8. Add persistence, resolver, fallback, and cross-screen tests
9. Run manual Home/Timer/Capture QA
10. Commit assets separately from code
