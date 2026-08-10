"""Prepare 160x160 cosmetic proof layers from approved chroma-key sources.

This script intentionally writes to docs/assets/cosmetic-drafts, not the live
public sprite manifest. The generated layers are visual alignment proofs and
must not be activated until their composite preview passes review.
"""

from pathlib import Path
import colorsys
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "docs" / "assets" / "cosmetic-sources" / "v1"
OUTPUT_DIR = ROOT / "docs" / "assets" / "cosmetic-drafts" / "v1" / "girl" / "study"
BASE_PATH = ROOT / "public" / "sprites" / "avatar" / "base" / "girl_study_01.png"
CANVAS_SIZE = (160, 160)

# Target rectangles on the existing 160x160 girl/study sprite.
# (left, top, right, bottom), with right/bottom exclusive.
ASSETS = {
    "purple-hoodie": ("girl-study-purple-hoodie-chroma.png", (37, 58, 124, 119)),
    "lavender-ribbon": ("girl-study-lavender-ribbon-chroma.png", (92, 26, 111, 46)),
    "round-glasses": ("girl-study-round-glasses-chroma.png", (51, 43, 112, 68)),
    "lavender-headphones": ("girl-study-lavender-headphones-chroma.png", (40, 16, 121, 78)),
}


def remove_green(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = pixels[x, y]
            # Generated chroma sources use a bright green field. Keep this
            # deliberately strict so cream skin/clothes cannot disappear.
            green_distance = ((r - 0) ** 2 + (g - 255) ** 2 + (b - 0) ** 2) ** 0.5
            alpha = 0 if green_distance <= 70 and g > r * 1.45 and g > b * 1.45 else 255
            if alpha == 0:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Remove the thin green spill left on opaque edge pixels.
                excess_green = max(0, g - max(r, b))
                pixels[x, y] = (r, max(0, g - int(excess_green * 0.8)), b, 255)
    return rgba


def fit_layer(source: Image.Image, target: tuple[int, int, int, int]) -> Image.Image:
    bbox = source.getbbox()
    if bbox is None:
        raise ValueError("Source contains no visible pixels after chroma removal")
    cropped = source.crop(bbox)
    left, top, right, bottom = target
    resized = cropped.resize((right - left, bottom - top), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(resized, (left, top))
    return canvas


def clear_hoodie_hand_openings(layer: Image.Image) -> None:
    """Let the canonical base hands show through the generated sleeves."""
    ImageDraw.floodfill(layer, (49, 94), (0, 0, 0, 0), thresh=70)
    ImageDraw.floodfill(layer, (104, 96), (0, 0, 0, 0), thresh=70)


def prepare_draft_bare_base(base: Image.Image) -> Image.Image:
    """Create a draft-only base without the baked cardigan or blue clip.

    The production pipeline will eventually use a true bare/default-hair
    export. This deterministic color-key cleanup exists only to judge layer
    alignment against the current composite sprite; it is not live art.
    """
    cleaned = base.copy()
    source = base.load()
    target = cleaned.load()
    # Remove the whole baked torso/sleeve silhouette, including its dark
    # outline. Color-keying alone leaves black cardigan fragments behind.
    alpha = cleaned.getchannel("A")
    mask_draw = ImageDraw.Draw(alpha)
    mask_draw.polygon([(29, 77), (47, 61), (66, 65), (68, 98), (58, 114), (35, 110)], fill=0)
    mask_draw.polygon([(78, 64), (105, 61), (130, 80), (126, 111), (104, 115), (91, 98)], fill=0)
    mask_draw.polygon([(54, 58), (98, 58), (106, 112), (48, 112)], fill=0)
    cleaned.putalpha(alpha)

    for y in range(base.height):
        for x in range(base.width):
            r, g, b, a = source[x, y]
            if a == 0:
                continue
            hue, saturation, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            in_clip_zone = 88 <= x < 119 and 20 <= y < 55
            in_outfit_zone = 25 <= x < 135 and 55 <= y < 122
            cool_colored = 0.42 <= hue <= 0.72 and saturation >= 0.12
            if cool_colored and (in_clip_zone or in_outfit_zone):
                target[x, y] = (0, 0, 0, 0)

    # Restore visible skin from the canonical source so the writing hands
    # remain available through sleeve openings in every outfit proof.
    for y in range(65, 120):
        for x in range(20, 140):
            r, g, b, a = source[x, y]
            if a == 0:
                continue
            hue, saturation, value = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            is_skin = 0.015 <= hue <= 0.12 and 0.12 <= saturation <= 0.65 and value >= 0.45
            if is_skin:
                target[x, y] = source[x, y]
    return cleaned


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    base = prepare_draft_bare_base(Image.open(BASE_PATH).convert("RGBA"))
    base.save(OUTPUT_DIR / "draft-accessory-free-base.png")

    layers: dict[str, Image.Image] = {}
    for name, (filename, target) in ASSETS.items():
        cleaned = remove_green(Image.open(SOURCE_DIR / filename))
        layer = fit_layer(cleaned, target)
        if name == "purple-hoodie":
            clear_hoodie_hand_openings(layer)
        layer.save(OUTPUT_DIR / f"{name}.png")
        layers[name] = layer

    # Three quick composites expose alignment issues without activating any
    # draft asset in the application.
    previews = {
        "preview-hoodie-ribbon.png": ["purple-hoodie", "lavender-ribbon"],
        "preview-glasses.png": ["round-glasses"],
        "preview-headphones.png": ["lavender-headphones"],
    }
    for filename, layer_names in previews.items():
        composite = base.copy()
        for layer_name in layer_names:
            composite.alpha_composite(layers[layer_name])
        composite.save(OUTPUT_DIR / filename)

    print(f"Prepared {len(layers)} draft layers and {len(previews)} previews in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
