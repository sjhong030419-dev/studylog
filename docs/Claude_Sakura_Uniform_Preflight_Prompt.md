# Claude Code Prompt — Sakura Uniform Preflight

Read `docs/StudyLog_Sakura_Uniform_Skin_PRD_v1.0.md` and inspect the current whole-avatar, black-hair, shop, persistence, Home/Timer, and Capture/Share code paths.

Do **not** implement or register the sakura skin yet. The two concept PNGs are high-resolution references, not production sprites, and the required 104 production PNGs have not been delivered.

Prepare the codebase for a future complete-skin preset with the smallest safe design proposal. Report:

1. Exact files that would need changes after the 104 PNGs arrive
2. Proposed `skin` shop category/type migration that preserves old localStorage
3. Deterministic precedence between sakura skin, black hair, unsupported cosmetics, base PNG, and SVG fallback
4. How Home's baked full-scene renderer must be bypassed for an equipped complete skin
5. How Capture/Share will use the same appearance
6. Validator additions needed for a second 104-file whole-avatar family
7. Required unit and regression tests
8. Risks and any conflict with the existing cosmetic PRDs

Rules:

- No code changes unless a genuine current bug is found
- Do not copy or downscale concept images into `public/`
- Do not invent missing production frames
- Do not reintroduce runtime layer compositing
- Do not alter timer, points, XP, Supabase, routing, or capture logic
- Do not create a commit for documentation-only analysis

Finish with a concise implementation checklist that can be executed after art delivery.
