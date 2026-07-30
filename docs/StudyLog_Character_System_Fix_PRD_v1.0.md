# StudyLog Character System Remediation PRD

**Version:** 1.0  
**Status:** Ready for implementation  
**Target repository:** StudyLog  
**Purpose:** Fix verified defects and incomplete architecture in the current character, Home, shop, EXP, room, and capture-card implementation  
**Priority:** P0/P1 stabilization before further visual expansion

---

## 1. Implementation Command

Read this entire document before editing.

The current code builds successfully, but it contains verified functional regressions and incomplete character-system architecture. Fix every acceptance item in this document without removing existing working features.

Do not stop after describing the issues. Inspect the repository, implement the fixes, run verification, and report the results.

---

## 2. Current Verified Baseline

The following commands currently complete:

```bash
npm run build
npm run lint
```

Current production build warning:

- Main JavaScript bundle is approximately 540 KB and triggers Vite's chunk-size warning.

There is currently no automated test script in `package.json`.

Important current architecture:

- Legacy `DotAvatar` has been removed.
- Character rendering is centered under `src/character/`.
- `CharacterView` is the public character rendering entry point.
- `ChibiFallbackArt` is the active visual renderer.
- Real sprite assets are not currently implemented.
- `SPRITE_ASSETS_AVAILABLE` is currently `false`.
- The shop still uses legacy emoji-based cosmetic definitions.
- Profile state includes gender, but no user-facing control currently updates it.

---

## 3. Golden Rules

### 3.1 Preserve

Do not break or remove:

- Timer start, pause, resume, stop, and session logging
- Subject selection and subject creation
- Away/app-exit detection
- Pomodoro behavior
- Points balance and transaction history
- Existing shop purchase and equip behavior
- Profile persistence
- Realtime room connection and seat behavior
- Capture-card save and share behavior
- Existing routes and navigation
- Existing Supabase contracts
- Existing persisted Zustand storage keys

### 3.2 Do not fabricate

Do not add:

- Fake owned cosmetics
- Fake rankings beyond existing explicitly marked development dummy data
- Fake EXP transactions
- Fake achievements not deterministically derived from real data
- Fake character states presented as implemented

### 3.3 Keep migrations compatible

Existing localStorage/Zustand persisted data must continue to load.

When adding new persisted fields:

- Supply safe defaults.
- Preserve existing stored values.
- Add a version/migration only when necessary.
- Do not clear existing user data.

---

## 4. Required Fix Summary

Implement all items:

1. Fix invalid Home card CSS variables.
2. Add a user-facing character appearance editor, including gender/presentation selection.
3. Restore equipped shop background rendering.
4. Separate Study XP from general/advertising points.
5. Replace emoji-overlay cosmetics with an extensible asset/slot architecture.
6. Make unsupported character states honest and deterministic.
7. Prevent capture UI buttons from appearing in generated images.
8. Fix room scene z-order and clipping.
9. Prevent per-seat animation timers from causing unnecessary room load.
10. Clean up completion timeouts.
11. Add focused unit tests for pure character and progression logic.
12. Re-run build, lint, tests, and manual regression checks.

---

# PART A — VERIFIED DEFECTS

## 5. Fix Invalid Home Card Background CSS

### Problem

The following Tailwind class:

```text
bg-[--color-home-card]
```

builds into:

```css
background-color: --color-home-card;
```

This is invalid CSS and is ignored by browsers.

### Affected components

At minimum:

- `src/components/home/CharacterRoomCard.tsx`
- `src/components/home/HomeProgressHeader.tsx`
- `src/components/home/StudyTimeSummary.tsx`

### Required implementation

Replace invalid usage with one supported approach:

```text
bg-[var(--color-home-card)]
```

or the supported Tailwind v4 custom-property syntax:

```text
bg-(--color-home-card)
```

Use one syntax consistently.

### Verification

After building, inspect generated CSS and confirm:

- `background-color:var(--color-home-card)` is present.
- `background-color:--color-home-card` is absent.

---

## 6. Add a Character Appearance Editor

### Problem

`profileStore` exposes `gender` and `setGender`, but no UI calls `setGender`. Users are permanently shown the default `boy` preset.

### Product decision

The UI should use the label **캐릭터 타입** or **기본 스타일**, not imply that clothes or hairstyles are restricted by gender.

Users must be able to select any compatible hair, color, clothing, and accessory regardless of selected base presentation.

### Required UI

Add a character-editing section in the most appropriate existing surface:

- Preferred: profile/My Page
- Acceptable: shop/avatar customization page

The editor must include:

- Live character preview
- Base presentation selection
- At minimum, current supported choices:
  - `boy`
  - `girl`
- Save/apply behavior
- Persistence through the existing profile store

If changes apply immediately through Zustand, a separate save button is optional, but the UI must make the active selection obvious.

### Accessibility

- Use real buttons or radio inputs.
- Expose selected state with `aria-pressed` or native checked state.
- Keyboard navigation must work.
- Do not communicate selection through color alone.

### Future-compatible naming

Do not name generic rendering branches `maleOnly` or `femaleOnly`.

Keep `Gender` for backward compatibility if needed, but treat it as a base visual preset rather than an item-access restriction.

---

## 7. Restore Equipped Background Cosmetics

### Problem

The existing shop still sells and equips `background` items, but the new character appearance resolver ignores `equipped.background`. The removal of `DotAvatar` made previously purchased backgrounds visually ineffective.

### Required implementation

Extend character/room appearance with a background definition.

Suggested contract:

```ts
export interface RoomAppearance {
  backgroundItemId?: string
  backgroundColor?: string
  backgroundAssetKey?: string
}
```

or extend the current resolved appearance contract cleanly.

Requirements:

- Resolve the equipped background item.
- Apply it to Home `RoomScene`.
- Apply it to profile preview.
- Apply it to shop preview.
- Apply it to capture-card `RoomScene`.
- Preserve default room styling when no background is equipped.
- Ensure dark backgrounds maintain readable UI and character contrast.

### Compatibility

Existing item IDs must continue to work:

- `bg-sky`
- `bg-night`
- `bg-sakura`

Do not rename stored item IDs.

### Verification

Manually equip each background and confirm all relevant previews update.

---

## 8. Separate Study XP From General Points

### Problem

Current level progression uses:

```ts
totalEarned()
```

This includes every earned point, including advertising bonuses and non-study rewards. As a result, users can level up the character and room without studying.

This violates the product rule:

> Character growth should be caused primarily by real study.

### Required domain separation

Maintain two concepts:

1. **Spendable Points**
   - Can come from study, ads, missions, promotions, or other rewards.
   - Can be spent in the cosmetic shop.

2. **Study XP**
   - Must come only from verified study activity.
   - Determines character level and room growth.
   - Must never decrease when points are spent.

### Preferred implementation

Derive lifetime Study XP from existing immutable study transactions:

```ts
studyXpTotal: () =>
  transactions
    .filter((transaction) => transaction.type === 'earn_study')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
```

If point rounding makes this insufficient for progression precision, derive Study XP directly from persisted study sessions with one documented formula.

Use one source consistently across:

- Home level header
- Character room level
- Room growth stages
- Level-up detection
- Profile
- Capture card

### Do not

- Use spendable balance as XP.
- Count `earn_bonus` advertising rewards as Study XP.
- Introduce two different level formulas on different screens.
- Reset existing points or sessions.

### Migration behavior

Existing users' Study XP must be derived from their existing `earn_study` transaction history or study sessions.

### Required tests

- Study transaction increases Study XP.
- Advertisement bonus increases point balance but not Study XP.
- Spending points decreases balance but not Study XP.
- Level remains stable after cosmetic purchase.

---

## 9. Replace Emoji Overlay Cosmetics With Slot-Based Assets

### Problem

The current character remains one monolithic SVG. Hair and accessories are rendered as emoji text:

```tsx
<text>{appearance.hairEmoji}</text>
<text>{appearance.accessoryEmoji}</text>
```

This is not an extensible character customization system and does not visually match the intended StudyLog character design.

### Required architecture

Create a data-driven cosmetic catalog with stable slots.

Minimum slots:

```ts
export type CharacterSlot =
  | 'bodyBase'
  | 'skin'
  | 'hairBack'
  | 'face'
  | 'eyes'
  | 'eyebrows'
  | 'mouth'
  | 'blush'
  | 'bottom'
  | 'shoes'
  | 'top'
  | 'onePiece'
  | 'outerwear'
  | 'hairFront'
  | 'faceAccessory'
  | 'headAccessory'
  | 'backAccessory'
  | 'handheld'
  | 'stateEffect'
```

Suggested item definition:

```ts
export interface CharacterAssetDefinition {
  id: string
  slot: CharacterSlot
  assetKey: string
  zIndex: number
  compatibleBasePresets?: string[]
  incompatibleItemIds?: string[]
  paletteOptions?: string[]
}
```

### Rendering requirements

- Define z-order centrally.
- Use shared canvas dimensions and anchors.
- Do not add item-ID-specific positioning conditionals to the renderer.
- Adding a new cosmetic should primarily require:
  1. An asset
  2. A catalog entry
- The main renderer must not require modification for ordinary new items.

### Practical scope

If final production artwork is not available:

- Keep the current SVG as the default base character temporarily.
- Extract at least the currently visible customizable parts into independent renderer components or asset definitions.
- Replace emoji cosmetics with original SVG/vector placeholder parts that align to the character.
- Clearly mark placeholder assets.
- Do not claim PNG sprite support is complete.

### Existing shop compatibility

Map existing IDs to original visual assets:

- `hair-ribbon` → head accessory asset
- `hair-straw` → headwear asset
- `hair-cap` → headwear asset
- `outfit-blue` → top/outfit asset
- `outfit-pink` → one-piece/outfit asset
- `outfit-gold` → top/outfit asset
- `acc-glasses` → face accessory asset
- `acc-headphone` → head accessory asset
- `acc-necklace` → neck/accessory asset

The shop may keep emoji thumbnails temporarily, but the equipped character must render an original aligned visual part—not an emoji badge.

### Definition of complete

The task is not complete if `hairEmoji` or `accessoryEmoji` remains in the character render path.

---

## 10. Handle Unsupported Character States Honestly

### Problem

These states are declared but have no distinct art:

- `thinking`
- `reading`
- `typing`
- `excited`
- `focused`

They silently render as `idle`.

### Required choice

Use one of these approaches:

#### Option A — Implement states

Provide distinct pose/expression behavior for every declared state.

#### Option B — Reduce the public state vocabulary

Remove unsupported states from currently selectable runtime state and keep them in a documented future-state list.

### Preferred result

Implement lightweight, visibly distinct fallback variants:

- `thinking`: hand/chin pose and upward eye direction
- `reading`: book held/open
- `typing`: laptop and hand movement
- `excited`: bright expression and bounce
- `focused`: reduced expression motion and attentive eyes

### Do not

- Advertise states as implemented when they always render `idle`.
- Load missing sprite paths.

---

## 11. Remove Capture Controls From Generated Images

### Problem

`CaptureTopBar` is rendered inside the element referenced by `cardRef`. Its share and save buttons are therefore included in PNG output.

### Required design

The final shared image may include:

- Brand name
- Date
- Decorative header

It must not include:

- Share button
- Save button
- Hover/focus state
- Loading spinner
- Interactive affordances

### Preferred implementation

Split:

```text
CaptureCardVisualHeader
CaptureControls
```

- `CaptureCardVisualHeader` stays inside `cardRef`.
- `CaptureControls` stays outside `cardRef`.

Alternative:

- Mark control nodes with `data-html2canvas-ignore`-style metadata only if supported by the actual capture library.
- Use `html-to-image`'s `filter` callback to exclude them.

Component separation is preferred because it is easier to verify.

### Additional capture requirements

- Do not capture disabled button states.
- Prevent duplicate share operations while generating.
- Clear capture timeout handles after success/failure.
- Preserve fallback download behavior when Web Share API is unavailable.
- Treat `AbortError` as user cancellation, not a product error.

### Manual verification

Generate both:

- Square image
- Story image

Open the actual PNG files and confirm no controls appear.

---

## 12. Fix Room Scene Z-order

### Problem

The cat and floor plant are currently placed in `RoomBackground`. `DeskForeground` is drawn afterward with an opaque region below `y=246`, which can cover the cat's body and lower plant.

### Required scene layers

Split into explicit layers:

```text
RoomBackLayer
RoomBehindDeskLayer
CharacterLayer
DeskBackLayer
DeskSurfaceLayer
DeskFrontLayer
PetForegroundLayer
EffectsLayer
```

The exact component names may differ, but z-order must be deliberate.

### Required outcome

- Cat body and tail remain intentionally visible.
- Plant pot is not unintentionally clipped.
- Character hands remain above notebook/desk where appropriate.
- Chair appears behind the character.
- Desk front may hide legs intentionally.
- Room background cosmetics apply behind all room contents.

---

## 13. Optimize Multi-seat Character Animation

### Problem

Each `CharacterView` creates its own `SpriteAnimator` interval. In a room with many occupied seats, this causes many independent timers and frequent React state updates.

### Required behavior

For small room avatars:

- Prefer static frame rendering by default.
- Animate only:
  - The current user's seat
  - A small number of visible/active avatars
  - Or use one shared animation clock

### Suggested API

```ts
interface CharacterViewProps {
  animated?: boolean
  animationClock?: number
}
```

In `SeatRoom`:

```tsx
<CharacterView animated={seat.occupantId === currentUserId} />
```

or use one parent-managed shared frame.

### Verification

Render a fully occupied room and confirm:

- Timer count does not scale one-for-one with every avatar.
- Room remains responsive.
- Home character animation remains intact.

---

## 14. Clean Up Completion Timers

### Problem

The level-up timeout is cleaned up through an effect, but the completion timeout created in `handleStop` is not tracked or cleared when the component unmounts.

### Required implementation

- Store the completion timeout ID in a ref.
- Clear an existing timeout before starting another.
- Clear it during component unmount.
- Avoid state updates after unmount.

Apply the same cleanup discipline to capture-generation timeouts.

---

# PART B — TESTING

## 15. Add Focused Unit Tests

Add the smallest testing setup compatible with the current Vite/React project. Prefer Vitest unless the repository already uses another test framework.

Minimum test files:

```text
src/character/engine/expLevel.test.ts
src/character/engine/characterStateMachine.test.ts
src/utils/avatarAppearance.test.ts
src/character/room/growthStages.test.ts
```

### Required cases

#### EXP

- Zero XP starts at level 1.
- Study-earned points increase Study XP.
- Ad bonus does not increase Study XP.
- Spending does not reduce Study XP.
- Exact level boundary produces the expected next level.

#### Character state

- Level-up has highest priority.
- Completion has priority over away/sleep/study.
- Away has priority over sleep/study.
- Paused maps to break.
- Inactive maps to idle.

#### Appearance

- Default appearance resolves safely.
- Equipped outfit maps to the correct asset.
- Equipped accessory maps to the correct slot.
- Equipped background maps to the room.
- Unknown/missing item IDs fall back safely.

#### Growth room

- Unlocks are cumulative.
- Level thresholds return expected additions.

Add:

```json
"test": "vitest run"
```

Do not add a large testing dependency stack.

---

## 16. Required Verification Commands

Run:

```bash
npm run test
npm run build
npm run lint
```

Also inspect built CSS:

```bash
rg "background-color:--color-home-card" dist
```

Expected result:

- No match.

---

## 17. Manual Regression Checklist

### Timer

- [ ] Start normal timer.
- [ ] Pause.
- [ ] Resume.
- [ ] Stop and record session.
- [ ] Confirm points are awarded.
- [ ] Confirm Study XP increases only from the study session.
- [ ] Confirm completion animation clears.

### Away behavior

- [ ] Leave the page during an active session.
- [ ] Confirm pause/away behavior.
- [ ] Return after a short interval.
- [ ] Return after a long interval.
- [ ] Confirm state and message remain correct.

### Character editor

- [ ] Change base character presentation.
- [ ] Reload page.
- [ ] Confirm selection persists.
- [ ] Confirm Home, profile, shop, capture, Pomodoro, and room use the selected character.

### Shop

- [ ] Buy/equip outfit.
- [ ] Buy/equip hair/headwear.
- [ ] Buy/equip accessory.
- [ ] Buy/equip each background.
- [ ] Confirm every item changes the relevant preview.
- [ ] Confirm purchasing does not reduce level.
- [ ] Confirm advertising does not increase Study XP.

### Room

- [ ] Join and claim a seat.
- [ ] Confirm presence status updates.
- [ ] Confirm gender/base presentation syncs.
- [ ] Confirm old clients or missing gender data fall back safely.
- [ ] Confirm many seats do not create excessive animation timers.

### Capture

- [ ] Generate square PNG.
- [ ] Generate story PNG.
- [ ] Confirm share/save buttons are absent from output.
- [ ] Confirm equipped character and background are included.
- [ ] Confirm Web Share cancellation does not show an error.
- [ ] Confirm unsupported browsers fall back to download.

### Responsive

- [ ] 320 px width
- [ ] 375 px width
- [ ] 390 px width
- [ ] 430 px width
- [ ] Short viewport
- [ ] No horizontal overflow

---

## 18. Acceptance Criteria

This remediation is complete only when:

1. No built CSS contains `background-color:--color-home-card`.
2. Users can change and persist their base character presentation.
3. Equipped backgrounds render in Home, profile/shop preview, and capture output.
4. Advertisement rewards do not increase character level.
5. Spending points does not reduce character level.
6. Character render code no longer uses `hairEmoji` or `accessoryEmoji`.
7. Existing shop item IDs map to aligned original visual assets.
8. New ordinary cosmetic items can be added without changing the main character renderer.
9. Declared runtime character states have distinct visual behavior or are removed from the supported runtime list.
10. Generated share images contain no interactive control buttons.
11. Cat, plant, character, chair, and desk layers render in the intended order.
12. Multi-seat rooms do not create one independent high-frequency animation loop per avatar.
13. Completion and capture timers are cleaned up.
14. Timer, Pomodoro, room, profile, shop, and capture behavior remain operational.
15. Unit tests pass.
16. Production build passes.
17. Lint passes.

---

## 19. Recommended Work Order

Implement in this order:

1. Fix CSS variable syntax.
2. Separate Study XP from general points and add tests.
3. Restore background appearance resolution.
4. Introduce cosmetic slot/catalog contracts.
5. Replace emoji render overlays with aligned assets.
6. Add character editor UI.
7. Complete or reduce supported state definitions.
8. Fix room z-order.
9. Optimize room animation.
10. Fix capture controls and timeout cleanup.
11. Run full regression verification.

Do not begin a major visual polish pass until functional regressions are fixed.

---

## 20. Completion Report Format

After implementation, report:

### Changed files

List every added, modified, and deleted file.

### Fixed issues

For each numbered PRD section:

- What changed
- Why it resolves the issue
- How it was verified

### Data compatibility

Explain:

- How existing profile data is preserved
- How existing equipped item IDs are preserved
- How Study XP is derived for existing users

### Verification results

Include exact results for:

```text
npm run test
npm run build
npm run lint
```

### Manual checks

List checks performed and any checks that still require the product owner.

### Known limitations

Clearly distinguish:

- Finished implementation
- Temporary original placeholder art
- Missing production art assets
- Future feature work

Do not report the task as complete if any acceptance criterion remains unresolved.

