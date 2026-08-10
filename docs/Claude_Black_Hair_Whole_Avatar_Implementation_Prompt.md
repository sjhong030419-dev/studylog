# Claude Code Task — Black Hair Whole-Avatar Item

Analyze the entire project before editing. Implement the black-hair item by
using the delivered whole-avatar assets. Do not generate, recolor, split, or
redraw any image.

## Goal

Add a purchasable and equippable `검정머리` item while preserving StudyLog's
MVP whole-avatar policy:

> One approved character PNG is rendered at a time. Never compose face, hair,
> body, clothing, hand, or accessory layers at runtime.

## Delivered assets

- Root: `public/sprites/avatar/whole/black-hair/`
- Gender delivered: `girl`
- Coverage: all 13 CharacterState values
- Frames: all 104 required girl frames
- Format: 160 x 160 RGBA PNG
- Naming: identical to the existing baked base files, for example:
  - `girl_idle_01.png`
  - `girl_study_01.png`
  - `girl_sleep_01.png`
  - `girl_happy_01.png`
- Design preview:
  `docs/assets/whole-avatar-previews/black-hair/girl-study-black-hair.png`
- Room concept preview only, not a runtime asset:
  `docs/assets/whole-avatar-previews/black-hair/girl-study-room-black-hair.png`

The 104 production PNGs preserve the original alpha silhouette and change
only the connected hair color region. Treat them as immutable source assets.

## Golden rules

- Preserve existing timer, capture, state management, API, persistence,
  points, purchase, authentication, routing, and database behavior.
- Do not delete `PixelSpriteRenderer` or any previous asset pipeline.
- Do not reactivate decomposed avatar layers.
- Do not use `avatar-layers/*` for this item.
- Do not render the black hair as an overlay.
- Do not partially activate missing boy assets.
- Boy characters must safely keep the approved default asset.
- Never show a broken image while changing state or frame.

## Item model

Add a separate shop category for hair color so a user can eventually equip a
hair color and a head accessory at the same time.

Recommended values:

- category: `hairColor`
- item id: `hair-color-black`
- display name: `검정머리`
- price type: `points`
- MVP price: `30`
- preview color: `#1B1A21`

Do not reuse the current `hair` category. Existing `hair` items are actually
head accessories (`리본 헤어핀`, `밀짚모자`, `야구모자`) and must remain
separately equippable.

Update every exhaustive `ShopCategory` mapping, including:

- `src/types/index.ts`
- `src/store/shopStore.ts`
- `src/components/shop/AvatarShop.tsx`
- `src/utils/avatarAppearance.ts`
- `src/cosmetics/slotAdapter.ts`
- related tests

Preserve persisted users who do not yet have `equipped.hairColor`.

## Whole-avatar resolver

Use the existing files:

- `src/character/engine/WholeAvatarRenderer.tsx`
- `src/character/engine/wholeAvatarSupport.ts`

Add a tested resolver for this path family:

`/sprites/avatar/whole/black-hair/{gender}_{state}_{frame}.png`

Reuse/export the existing state filename and zero-padded frame conventions
from `spriteManifest.ts`; do not duplicate an inconsistent state-name table.

Register the black-hair variant only for `girl` because only the girl family
is delivered. The resolver must return the default baked base path for `boy`.

Change variant matching from strict equality to a most-specific supported
subset rule:

1. A variant declares its required equipped item ids.
2. It matches when all required ids are equipped and the gender is supported.
3. If multiple complete variants match, choose the one with the most required
   ids.
4. Unsupported extra items are ignored visually instead of reverting the
   character to brown hair.

This allows `검정머리 + 미지원 리본` to keep the black-hair character while
the ribbon remains visually pending. When a complete `black-hair+ribbon`
family is delivered later, it can win as the more-specific variant.

## Shop UX

- Add a `머리색` category tab.
- Show the black swatch and `검정머리` name.
- Preserve the existing point purchase flow.
- Purchased items appear in ownership state.
- Equipping and unequipping persists through Zustand storage.
- Clearly mark the item `여자 캐릭터 지원` until boy assets exist.
- If the current gender is boy, disable equipping or show an honest pending
  message; do not deduct points for an unusable purchase without disclosure.

## Screen behavior

The whole-avatar variant must work anywhere `CharacterView` is rendered,
including profile, shop preview, onboarding-compatible views, Pomodoro, and
seat rooms.

Important limitation: Home and capture currently prefer fully baked room
scene WebPs whose character is already painted into the room. The delivered
room image is a concept preview only. Do not pretend the hair color is applied
inside those baked scenes and do not replace production scene WebPs with the
preview.

For this task:

- keep existing baked room scenes unchanged;
- document this limitation in the UI or implementation notes;
- do not switch Home/capture to the experimental layered room;
- leave a clear extension point for future complete room-scene variants.

## Required tests

Add or update tests proving:

1. `hairColor` is independent from the existing `hair` accessory category.
2. The item can be purchased, equipped, unequipped, and persisted.
3. Girl + `hair-color-black` resolves every state/frame to the black-hair
   whole-avatar path.
4. Boy + `hair-color-black` resolves to the default base character.
5. Unsupported additional items do not remove the black-hair variant.
6. A more-specific future complete variant wins over a less-specific one.
7. Missing/broken whole-avatar files fall back without a broken image.
8. Existing shop, point, timer, capture, and appearance tests still pass.

## Validation

Run:

```text
npm run validate:assets
npm test
npm run lint
npm run build
```

Also manually verify at least:

- girl idle
- girl study
- girl sleep
- girl happy
- purchase with insufficient points
- purchase with sufficient points
- equip, reload, and unequip
- switch to boy and confirm safe default fallback

## Final report

Report:

- changed files
- item id/category/price
- exact whole-avatar path convention
- tests and build results
- known baked-room limitation
- screenshots or concise manual verification results

Do not claim Home/capture room-scene support until complete black-hair room
scene assets are delivered and approved.
