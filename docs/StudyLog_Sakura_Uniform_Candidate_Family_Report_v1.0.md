# StudyLog Sakura Uniform Candidate Family Report v1.0

## Outcome

A complete review-only girl candidate family was generated for the `sakura-uniform-v1` skin.

- Frames: 104/104
- States: 13/13
- Canvas: 160×160
- Mode: RGBA PNG
- Missing files: 0
- Unexpected files: 0
- Alpha drift from base: 0
- Frames without a visible clothing change: 0
- Changed pixels per frame: 1,263–2,108

Candidate path:

```text
docs/assets/skin-candidates/sakura-uniform-v1/frames/
```

These files remain outside `public/` and are not registered in the app.

## Pose system

The 13 states share four actual pose families:

| Pose | States |
|---|---|
| Standing | idle, thinking, break, away |
| Desk | study, reading, typing, focused |
| Sleep | sleep |
| Celebrate | happy, excited, celebrate, levelUp |

One deterministic clothing mask per pose family keeps the outfit stable across animation frames and prevents independently generated face/body drift.

## Preserved elements

- face, eyes, expression, and skin tone
- brown hair geometry and existing hair clip
- hands, arms, legs, and exact pose
- desk, open book, pencil, and writing alignment
- sleep Zzz effect
- celebration sparkles
- source alpha channel and silhouette

## Review material

- Overall: `docs/assets/skin-candidates/sakura-uniform-v1/all-states-overview.png`
- Per-state sheets: `docs/assets/skin-candidates/sakura-uniform-v1/contact-sheets/`

## Reproduction and validation

```text
scripts/buildSakuraUniformCandidateFamily.py
scripts/validateSakuraUniformCandidates.py
```

The builder writes only to the documentation candidate directory. The validator compares every candidate with its matching base frame and fails on missing files, extras, wrong dimensions, alpha drift, or a frame with no clothing change.

## Visual assessment

The family is consistent and technically safe as a palette-based complete skin. It intentionally favors identity and animation stability over the more elaborate sailor-collar details shown in the high-resolution ImageGen concepts.

The visible result is a cream, dusty-sakura, and charcoal school-uniform variation of the existing character. It does not redraw the character or introduce a separate illustration style.

## Remaining gate

Human visual approval is still required before promotion into `public/sprites/avatar/whole/sakura-uniform/`.

After approval:

1. Copy the 104 reviewed frames into the production whole-avatar path.
2. Extend the production asset validator with a second 104-file family.
3. Register one complete-skin shop item.
4. Add deterministic skin precedence and fallback tests.
5. Connect Home, Timer, Profile, Shop, realtime room, and Capture/Share.
6. Run manual square and 9:16 capture QA.

Do not silently promote these candidates or expose a purchasable item before that gate.
