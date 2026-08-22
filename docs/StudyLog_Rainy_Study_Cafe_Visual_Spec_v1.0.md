# StudyLog Rainy Study Cafe Visual Spec v1.0

## 1. Status

- Status: **implemented and verified**
- Runtime integration: **complete**
- Theme ID recommendation: `rainy-study-cafe`
- Asset strategy: baked whole-avatar and baked full-room scenes
- This package is intentionally isolated from the reward-feedback work currently in progress.

## 2. Product Intent

Rainy Study Cafe is a premium seasonal cosmetic that turns studying into a warm refuge on a rainy night. It must feel collectible and emotionally distinct without changing timer, study records, points, quests, capture, or persistence logic.

The emotional target is:

> I want to sit in this warm cafe with my character and keep studying while it rains outside.

## 3. Visual Direction

- Warm amber cafe interior contrasted with rainy blue-gray windows
- Cream, walnut brown, muted teal, dusty rust, amber gold, and rainy blue-gray palette
- Wooden study desk, cafe lighting, books, notebook, pencil, steaming mug, plant, brass details, and cream cafe cat
- Same polished cozy chibi/pixel-inspired rendering as existing StudyLog premium illustrations
- Original life-sim atmosphere; do not copy franchise characters, logos, or proprietary assets

## 4. Character Identities

### Girl

- Short warm dark-brown bob with bangs
- Small cafe-themed hair clip
- Muted-teal knit cardigan, cream blouse, dusty-rust ribbon
- Dark skirt or shorts with warm brown shoes

### Boy

- Tousled warm dark-brown hair
- Muted-teal knit cardigan or vest, cream shirt, dusty-rust tie
- Dark trousers with warm casual shoes

Identity, face, hair, outfit, palette, and proportions must remain stable in every screen and state.

## 5. State Contract

Both genders provide the following states in this exact order:

1. `idle` — calmly ready to study
2. `study` — actively writing and focused
3. `sleep` — gently dozing or drowsy
4. `happy` — cheerful study-completion celebration

State fallback order must follow the existing whole-avatar fallback contract. Do not introduce a new runtime layer compositor.

## 6. Source Assets

All paths are relative to the repository root.

| File | Purpose | Dimensions | Grid |
|---|---|---:|---:|
| `docs/assets/skin-concepts/rainy-study-cafe-v1/room-contact-sheet.png` | Normalized full-room source | 1280x800 | 4x2 |
| `docs/assets/skin-concepts/rainy-study-cafe-v1/avatar-contact-sheet.png` | Normalized whole-avatar source | 960x480 | 4x2 |
| `docs/assets/skin-concepts/rainy-study-cafe-v1/room-contact-sheet-original.png` | Untouched generated room source | 1586x992 | 4x2 visual grid |
| `docs/assets/skin-concepts/rainy-study-cafe-v1/avatar-contact-sheet-original.png` | Untouched generated avatar source | 1774x887 | 4x2 visual grid |

The normalized sheets are the deterministic crop sources. The originals exist only for visual reference and possible future re-export.

### Prepared derived assets

The deterministic crops have already been exported. Integration should consume these files instead of cropping at runtime:

- `docs/assets/skin-concepts/rainy-study-cafe-v1/room/{girl|boy}/{idle|study|sleep|happy}.png`
- `docs/assets/skin-concepts/rainy-study-cafe-v1/avatar/{girl|boy}/{idle|study|sleep|happy}.png`

Expected dimensions:

- Each room scene: `320x400`
- Each whole-avatar image: `240x240`

## 7. Deterministic Cropping

### Room sheet

- Canvas: 1280x800
- Cell: 320x400
- Row 0: girl
- Row 1: boy
- Columns 0–3: `idle`, `study`, `sleep`, `happy`

### Avatar sheet

- Canvas: 960x480
- Cell: 240x240
- Row 0: girl
- Row 1: boy
- Columns 0–3: `idle`, `study`, `sleep`, `happy`

Crop without overlap. Preserve original files. Export derived runtime files into a new theme-specific folder rather than overwriting an existing skin.

## 8. Runtime Asset Policy

- Use complete baked images for each supported combination.
- Do not split faces, hair, clothes, hands, or accessories into runtime layers for this theme.
- Do not synthesize missing combinations in CSS or canvas.
- If an asset is absent or fails to load, use the existing safe fallback chain.
- Home, Timer, Capture/Share, Shop preview, and equipment preview must resolve appearance from the same `CharacterAppearance` source.
- A selected theme must not produce different character identities between screens.

## 9. Capture and Share Direction

The share card should use the full-room illustration as its visual hero. Keep level, XP, study time, subject, and message in separate safe zones; none may cover the character's face, hands, or primary study action.

Recommended share treatment:

- Rainy blue-gray outer frame
- Warm cream information panel
- Muted-teal primary accent
- Dusty-rust achievement accent
- Amber highlight for XP and completion rewards
- Very subtle rain motif; no animated capture dependencies

## 10. Economy Recommendation

Rainy Study Cafe should be cosmetic only. Recommended acquisition options:

- Seasonal point shop bundle
- Season completion reward
- Limited mission chain reward
- Premium cosmetic purchase

The girl and boy versions belong to one entitlement. Changing gender must not require repurchase. The full-room theme and matching whole-avatar outfit should be granted and equipped atomically unless the product later introduces an explicit bundle-content selector.

## 11. Engineering Integration Checklist

Do this only after the concurrent reward-feedback work is complete and the worktree is reviewed.

- [ ] Confirm a clean or understood worktree before integration
- [x] Crop eight room scenes from the normalized room sheet
- [x] Crop eight whole-avatar sprites from the normalized avatar sheet
- [x] Optimize derived PNG/WebP files without changing dimensions or alpha behavior
- [x] Add a new manifest/theme entry; do not mutate an existing theme ID
- [x] Register both genders and all four states
- [x] Reuse current `CharacterAppearance`, inventory, ownership, equip, and persistence flows
- [x] Resolve the same equipped theme in Home, Timer, Capture/Share, and previews
- [x] Preserve safe fallback behavior for missing or failed assets
- [x] Add tests for gender x state x screen resolution
- [x] Verify refresh persistence through the existing persisted shop/settings stores
- [x] Verify capture theme ownership and mobile layout behavior
- [x] Run TypeScript, lint, full tests, production build, and asset validation

## 14. Implementation Result

- Shop item: `skin-rainy-study-cafe`, 220P, cosmetic only
- Whole-avatar runtime family: 208 validated `160x160` PNG files
- Full-room runtime family: 8 validated `640x800` WebP files
- Shop presentation: square thumbnail, two-character banner, theme icon
- Capture theme: `rainyCafe`, unlocked only while the skin is owned
- Existing full-scene and whole-avatar fallback chains remain unchanged
- Final verification: 448 tests passed, lint passed, production build passed, production asset validation passed

## 12. Acceptance Criteria

- Both genders have visually consistent `idle`, `study`, `sleep`, and `happy` assets.
- The cafe room, character, outfit, lighting, and props look like one illustration system.
- Home, Timer, and Capture/Share display the same equipped gender and theme.
- No UI text obscures the character in capture output.
- Existing timer, records, points, quests, shop ownership, equipment, and persisted state remain unchanged.
- No runtime avatar-layer composition is introduced.
- Missing assets degrade through the existing fallback chain without a broken image.
- TypeScript, lint, tests, production build, and asset validation pass.

## 13. Non-goals

- Rewriting the equipment or economy architecture
- Adding a generalized layer-composition engine
- Replacing existing skins
- Changing study logic or reward amounts
- Shipping before visual and cross-screen QA
