# StudyLog Sakura Uniform Proof Report v1.0

## Result

Two geometry-locked 160×160 RGBA proofs were produced from the approved base sprites:

- `docs/assets/skin-proofs/sakura-uniform-v1/girl_idle_01-proof.png`
- `docs/assets/skin-proofs/sakura-uniform-v1/girl_study_01-proof.png`
- Enlarged review board: `docs/assets/skin-proofs/sakura-uniform-v1/sakura-uniform-proof-board.png`

## Method

The high-resolution ImageGen concepts remain visual references only. They were not downscaled into production sprites because they contain a baked checkerboard and redraw the character's face and proportions.

The proofs instead start from the exact existing 160×160 base frames. A deterministic script changes only cool blue-gray clothing pixels inside explicit pose-specific masks:

- cardigan and sleeves → warm cream
- collar accent → muted sakura
- lower garment → warm charcoal
- idle footwear → muted sakura

Source: `scripts/buildSakuraUniformProofs.py`

## Automated checks

| Proof | Size | Mode | Changed pixels | Alpha vs. base |
|---|---:|---|---:|---|
| idle | 160×160 | RGBA | 1,650 | identical |
| study | 160×160 | RGBA | 1,263 | identical |

Because alpha is byte-identical, the silhouette, transparent background, and canvas placement cannot drift. Pixels outside the explicit clothing masks are never edited by the generator.

## Visual assessment

Pass:

- StudyLog girl identity is preserved
- face, eyes, expression, hair shape, hands, and pose remain stable
- desk, book, and pencil remain aligned
- palette is warm and visibly distinct from the default outfit
- the outfit reads correctly at the app's real pixel scale

Still required before full production:

- Decide whether the simple geometry-locked version is preferred over adding more sailor-collar detail
- Approve idle and study palette balance
- Define pose masks for the remaining 11 states
- Produce candidate contact sheets before any files enter `public/`

## Gate decision

Do not register the skin in code yet. The next safe step is visual approval of this proof board. After approval, expand the deterministic pipeline state-by-state and visually inspect every contact sheet before producing the complete 104-file family.
