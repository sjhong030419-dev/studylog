# StudyLog Art Production Status

**Version:** 1.2  
**Updated:** 2026-08-09  
**Runtime policy:** Never activate incomplete or visually incompatible art.

## MVP avatar decision

- The production character uses one fully composed PNG per gender, state,
  and frame. Face, hair, body, clothes, hands, and study props are not
  assembled from independently generated layers at runtime.
- `CharacterView` renders approved PNGs through `WholeAvatarRenderer`.
- `wholeAvatarSupport.ts` is the only registry for future baked cosmetic
  variants. It intentionally starts empty: an equipped item without a fully
  approved image family leaves the default character unchanged.
- A cosmetic variant may be registered only after every required gender,
  state, and frame is delivered and visually reviewed.
- The previous decomposed avatar artwork and renderer remain as inactive
  production references. Nothing was deleted, so the team can revisit a
  layered system after the visual identity and item catalogue mature.

## Default-night room

- 18/18 manifest PNG files are delivered at 640 x 800 RGBA.
- Room environment layers remain independently reusable.
- Home, timer, and capture currently prefer cohesive baked room scenes, so
  character identity is not altered by runtime layer composition.
- The experimental layered room stays gated by
  `ROOM_AVATAR_COMPOSITION_READY = false`.

## Adding a cosmetic item

1. Pick one exact item combination, such as `hoodie` or `hoodie+ribbon`.
2. Produce the complete character for every required gender/state/frame.
3. Compare face shape, eye placement, head scale, pose, and silhouette with
   the approved default master.
4. Place the complete files under a versioned whole-avatar asset family.
5. Register the exact equipped-item combination in
   `WHOLE_AVATAR_VARIANTS` only after all files pass review.
6. Verify Home, timer, capture, profile, shop, onboarding, and study room.

## Verification completed

- Unit tests: 287 passed.
- Test files: 22 passed.
- Lint: passed.
- TypeScript and production build: passed.
- Local visual check: Home and capture use cohesive, fully baked scenes.
