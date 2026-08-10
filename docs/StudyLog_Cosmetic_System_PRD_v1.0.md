# StudyLog Cosmetic Collection & Equipment System PRD

**Version:** 1.0  
**Status:** Ready for staged implementation  
**Product:** StudyLog  
**Primary implementer:** Claude Code  
**Related specification:** `docs/StudyLog_Asset_Layer_Spec_v1.0.md`

---

## 1. Product Goal

Turn real study activity into visible ownership and character growth.

The intended loop is:

```text
Study
→ Earn points or complete a reward condition
→ Obtain a cosmetic item
→ Preview and equip it
→ See it consistently on Home, Timer, Capture, Profile, and Shop
→ Share the personalized result
→ Want to study again
```

StudyLog is not selling stronger characters. It is helping users build a character and study room that feel personally theirs.

---

## 2. Product Principles

1. **The character is the emotional center.** Cosmetics must make the character feel more personal, not turn the product into a generic store.
2. **Studying is the primary source of progression.** Points, levels, streaks, and achievements should unlock meaningful cosmetic choices.
3. **Cosmetics are not pay-to-win.** Purchased items must not increase study XP, timer rewards, ranking, or focus statistics.
4. **What the user equips must appear everywhere.** A cosmetic system is incomplete if it works only in the Shop preview.
5. **No fake ownership or rewards.** Render only items the user actually owns and has equipped.
6. **Art compatibility is data, not hardcoded UI logic.** Components must never contain item-ID-specific rendering branches.

---

## 3. Golden Engineering Rules

Preserve the existing:

- Timer and Pomodoro logic
- Study session data
- Study XP and level calculation
- Points ledger and balance
- Existing shop item IDs
- Purchase and equipment persistence
- Authentication, API, routing, and Supabase behavior
- Character states and gender selection
- Capture download/share flow
- Safe fallback renderers

Do not:

- Replace the points store with a new currency implementation
- Rewrite stable timer logic to award cosmetics
- Delete existing owned/equipped data
- Couple purchase eligibility to whether an image happens to be loaded
- Add random paid loot boxes in MVP
- Enable real-money items before payment, refund, restoration, and legal requirements are reviewed
- Claim the current flat full-scene illustration supports cosmetics

---

## 4. Current-State Assessment

The project already contains useful foundations:

- `src/store/shopStore.ts`: catalog, owned IDs, equipped category map, points purchase, cash-purchase boundary
- `src/components/shop/AvatarShop.tsx`: category browsing, purchase, equip, unequip, preview
- `src/hooks/useMyAvatarAppearance.ts`: converts equipped store state into renderable appearance
- `src/character/catalog/items.ts`: maps item IDs to render slots and z-order
- `src/character/engine/PixelSpriteRenderer.tsx`: layered character rendering boundary
- `src/character/room/roomAssetManifest.ts`: layered room manifest with level and shop-item gates
- `src/character/room/RoomScene.tsx`: shared room entry point

### Critical limitation

`FullSceneRoomRenderer` displays a flattened full-scene illustration selected by state and gender. It does not render the equipped appearance or room props. It therefore cannot be the final renderer for customizable Home, Timer, or Capture experiences.

The implementation must migrate toward a layered scene while preserving the full-scene image as a temporary fallback/reference.

---

## 5. MVP Scope

### Character slots

- Hair style
- Outfit/top
- Head accessory
- Face accessory

### Room slots

- Room theme/background
- Desk
- Chair
- Lamp
- Desk prop
- Pet

### Required user actions

- Browse by category
- Preview before purchase
- Purchase with points
- View owned/unowned state
- Equip an owned item
- Unequip an optional item
- Replace an item in the same exclusive slot
- Restore equipped state after reload
- See the result on every character-bearing surface

### Explicitly deferred

- Trading or gifting
- User-to-user marketplace
- Loot boxes/gacha
- Item crafting
- Dyes with arbitrary color blending
- Separate shoes and pants while the character remains seated
- Multiple simultaneous pets
- Season pass
- Real-money production launch

---

## 6. Catalog Model

Create one canonical cosmetic catalog. Store behavior, rendering, Shop UI, rewards, and capture must all reference it.

Suggested domain model:

```ts
export type CosmeticSlot =
  | 'hair'
  | 'outfit'
  | 'headAccessory'
  | 'faceAccessory'
  | 'roomTheme'
  | 'desk'
  | 'chair'
  | 'lamp'
  | 'deskProp'
  | 'pet'

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AcquisitionType =
  | 'default'
  | 'points'
  | 'level'
  | 'streak'
  | 'achievement'
  | 'event'
  | 'premium'

export interface CosmeticItemDefinition {
  id: string
  name: string
  slot: CosmeticSlot
  rarity: CosmeticRarity
  acquisitionType: AcquisitionType
  pointPrice?: number
  assetKey: string
  thumbnailSrc: string
  zIndex: number
  defaultOwned?: boolean
  compatibleGenders: Array<'female' | 'male'> | 'all'
  supportedStates: Array<'idle' | 'study' | 'sleep' | 'happy'>
  tags?: string[]
  availableFrom?: string
  availableUntil?: string
}
```

Rules:

- `id` is permanent after release.
- UI labels and asset filenames may change without changing `id`.
- No renderer imports the store catalog directly and switches on individual IDs.
- Invalid or missing catalog entries fail safely and never erase ownership.
- Each exclusive slot has at most one equipped item.
- Optional props/accessories may be unequipped; required base slots resolve to a default.

### Backward compatibility

Keep existing IDs such as `hair-ribbon`, `outfit-blue`, and `acc-glasses`. Add an adapter from the current `ShopCategory` shape to the new slot model before changing persisted storage.

Do not perform a destructive local-storage migration. Use a versioned Zustand migration and retain unknown owned IDs.

---

## 7. Ownership and Equipment Model

Ownership and equipment are separate concepts.

```ts
interface InventoryEntry {
  itemId: string
  acquiredAt: string
  source: AcquisitionType
}

type EquippedCosmetics = Partial<Record<CosmeticSlot, string>>
```

Invariants:

- An item must be owned before it can be equipped.
- Equipping an item replaces only the item in the same exclusive slot.
- Purchasing an item may auto-equip it, but the UI must communicate this.
- Unequipping does not remove ownership.
- Spending points never changes study XP or level.
- Failed purchases do not mutate ownership or balance.
- Duplicate rewards do not create duplicate ownership entries; define a deterministic fallback reward, such as points, later.

For MVP, existing `ownedItemIds` may remain the persisted representation. Introduce acquisition metadata only when a database or storage migration is explicitly approved.

---

## 8. Avatar Economy

### Primary earning paths

| Source | Reward type | MVP |
|---|---|---:|
| Completed focused study | Existing points | Yes |
| Level milestone | Deterministic cosmetic | Yes, small set |
| Streak milestone | Deterministic accessory | Later MVP |
| Achievement | Themed cosmetic | Later MVP |
| Seasonal event | Limited cosmetic | Post-MVP |
| Premium purchase | Cosmetic only | Deferred until payment readiness |

### Economy rules

- Price common items so a new user can earn the first choice quickly.
- The first meaningful item should be obtainable without payment or advertising.
- Avoid excessively rewarding uninterrupted duration; reward consistency and completed sessions.
- Ads may award spendable points only and must remain optional.
- Premium items must not affect ranking, XP, focus score, streak protection, or timer behavior.
- Clearly label limited availability; never fake scarcity.

### Suggested initial catalog

- 2 default hair styles
- 3 unlockable hair styles
- 1 default outfit
- 4 unlockable outfits
- 3 head accessories
- 2 face accessories
- 1 default room theme
- 1 unlockable room theme
- 2 desk props
- 1 lamp variant
- 1 pet

This is enough to validate personalization without creating an unmanageable art workload.

---

## 9. User Experience

### 9.1 Shop/Collection

Every item card shows:

- Actual rendered thumbnail, not an emoji placeholder
- Name
- Rarity
- Price or unlock condition
- Owned/locked/equipped state
- Unsupported-art status only in development, never as a broken production purchase

Filters:

- All
- Owned
- Not owned
- Equipped

### 9.2 Dressing room

Selecting an item updates a temporary preview without immediately changing persisted equipment.

Actions:

- `착용하기`
- `원래대로`
- `저장`

Closing with unsaved changes should restore the persisted equipment or ask for confirmation.

### 9.3 Reward reveal

When a real cosmetic is awarded:

```text
공부 완료!
+ Study XP
+ Points
새 아이템 획득: 벚꽃 머리핀 (Rare)
[바로 착용] [나중에]
```

Never show an item reward unless it has been persisted successfully.

### 9.4 Consistent surfaces

The equipped appearance must match on:

- Home
- Normal timer
- Pomodoro
- Completion/result screen
- Square capture
- 9:16 capture
- Profile/My Page
- Shop preview after saving
- Realtime room, within its supported fidelity

One shared scene/appearance resolver must provide this state. Screens must not independently reconstruct equipment.

---

## 10. Rendering Strategy

Use the layered asset contract in `StudyLog_Asset_Layer_Spec_v1.0.md`.

Target pipeline:

```text
useShopStore equipped IDs
→ useMyAvatarAppearance / shared scene resolver
→ canonical cosmetic catalog
→ compatible assets for gender + character state
→ deterministic z-order
→ RoomScene
→ same visible result across product surfaces
```

### Full-scene migration

1. Keep the current flattened full-scene art as a fallback and art reference.
2. Produce the baseline room and avatar as aligned transparent layers.
3. Activate layered rendering only when all critical baseline layers are confirmed.
4. Add one real item per slot and test all states.
5. Switch Home, Timer, and Capture to the same layered renderer.
6. Retain fallback behavior for missing or failed assets.

Do not solve customization by exporting one full-scene image for every possible outfit/room combination. That grows combinatorially and is not maintainable.

---

## 11. State Compatibility

MVP states:

- `idle`
- `study`
- `sleep`
- `happy`

Every cosmetic declares supported states. A purchasable MVP character cosmetic should support all required states before release.

If an asset is missing for the active state:

1. Keep ownership/equipment unchanged.
2. Render the slot's safe default for that state.
3. Log a development warning once.
4. Never show a broken image icon.

Room props may be state-independent. Desk-front layers may remain state-dependent to avoid the existing double-desk problem.

---

## 12. Accessibility and Performance

- Respect `prefers-reduced-motion`.
- Cosmetic meaning must not rely only on color.
- Buttons require readable labels and visible selected states.
- Preload only the active scene and the next likely preview.
- Lazy-load shop thumbnails.
- Avoid base64 assets in application code.
- Use CSS transforms for subtle animation; avoid layout-changing animation.
- Keep capture deterministic by rendering a static frame.
- Establish a performance budget after measuring real layered assets; do not silently ship dozens of multi-megabyte PNGs.

---

## 13. Implementation Phases

### Phase 0 — Audit and checkpoint

- Confirm the working tree and save/record unrelated changes.
- Run tests, build, and lint.
- Document current persisted `studylog-shop` shape.
- Do not begin a migration while P0 defects exist.

### Phase 1 — Domain and adapters

- Add canonical slots and catalog metadata without changing UI behavior.
- Preserve old IDs and persisted equipment.
- Add catalog validation tests: duplicate ID, invalid z-index, missing required defaults, incompatible state declaration.

### Phase 2 — Production asset baseline

- Deliver baseline transparent layers according to the asset spec.
- Add asset manifest and confirmed-support registry.
- Verify alignment at 320/375/390/430 px.
- Keep full-scene fallback active until the baseline is complete.

### Phase 3 — End-to-end equipment

- Implement one item per character slot and one item per room slot.
- Confirm purchase → ownership → equip → reload → render.
- Confirm Home, Timer, Capture, Profile, and Shop consistency.

### Phase 4 — Collection UX

- Replace emoji previews with generated thumbnails.
- Add owned/equipped filters and temporary dressing-room preview.
- Add clear empty, locked, and insufficient-points states.

### Phase 5 — Rewards

- Add deterministic level/reward mappings through an adapter around existing reward logic.
- Persist reward before reveal.
- Add duplicate and interrupted-flow tests.

### Phase 6 — Release QA

- Complete all acceptance tests.
- Only then expand the catalog.

---

## 14. Required Tests

### Store/domain

- Cannot equip an unowned item
- Purchase spends exactly the listed points once
- Failed purchase makes no changes
- Equip replaces only the same slot
- Unequip preserves ownership
- Reload restores ownership and equipment
- Unknown legacy ID does not crash or get deleted

### Rendering

- Correct z-order
- Gender/state asset resolution
- Missing optional asset falls back safely
- Missing critical asset activates safe scene fallback
- Equipped character cosmetics appear in static capture
- Equipped room props appear in static capture
- Square and story output do not clip the avatar

### Economy

- Study XP and spendable points remain independent
- Duplicate reward is deterministic
- Premium cosmetic never changes gameplay metrics

---

## 15. Acceptance Criteria

The MVP cosmetic system is complete only when:

- A user can earn or buy an item with existing points.
- Ownership and equipment persist after reload.
- The user can preview, equip, replace, and unequip items safely.
- The same equipped result appears on Home, Timer, and both capture formats.
- Character and room items layer naturally without clipping or double furniture.
- Missing assets fail safely.
- Existing timer, data, XP, points, and navigation behavior remains intact.
- Tests, TypeScript build, and lint pass.
- The implementation adds new items through catalog/asset registration rather than renderer conditionals.

---

## 16. Claude Code Completion Report

After each phase, report:

1. Phase completed/partial/blocked
2. Files changed
3. Persisted-data migrations and rollback behavior
4. Items/states/surfaces verified
5. Exact test, build, and lint results
6. Manual mobile widths checked
7. Known missing production art
8. Remaining product-owner decisions

Do not claim completion based only on the Shop preview. End-to-end visual consistency is the release gate.

