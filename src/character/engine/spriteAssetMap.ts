/**
 * PNG sprite asset pipeline is not built yet — no image files exist in the
 * project (docs/character-system.md §9-§13 documents the target spec and
 * the exact file list still needed; it is not current reality). This flag
 * is the single switch: flip it to `true` once real sprite files are added
 * under `public/sprites/avatar/` (see `spriteManifest.ts` for every path
 * this app will look up), and `CharacterView` will render
 * `PixelSpriteRenderer` instead of the `ChibiFallbackArt` SVG. No other
 * file needs to change.
 */
export const SPRITE_ASSETS_AVAILABLE = false
