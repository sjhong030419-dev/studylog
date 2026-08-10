"""Create identity-locked whole-avatar hair color previews.

Only pixels belonging to the largest connected brown hair region are
recolored. Face, eyes, skin, clip, clothes, pose, props and room pixels are
copied byte-for-byte from the approved masters.
"""

from collections import deque
from colorsys import rgb_to_hsv
from pathlib import Path

from PIL import Image


ROOT = Path.cwd() if (Path.cwd() / "package.json").exists() else Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "assets" / "whole-avatar-previews" / "black-hair"
PRODUCTION_OUTPUT = ROOT / "public" / "sprites" / "avatar" / "whole" / "black-hair"


def brown_candidate(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    if alpha == 0:
        return False
    hue, saturation, value = rgb_to_hsv(red / 255, green / 255, blue / 255)
    return (hue <= 0.13 or hue >= 0.98) and saturation >= 0.22 and 0.12 <= value <= 0.82


def seeded_hair_region(
    image: Image.Image,
    bounds: tuple[int, int, int, int],
    seed: tuple[int, int],
) -> set[tuple[int, int]]:
    x0, y0, x1, y1 = bounds
    candidates = {
        (x, y)
        for y in range(y0, y1)
        for x in range(x0, x1)
        if brown_candidate(image.getpixel((x, y)))
    }
    if not candidates:
        raise ValueError("No connected brown hair region found")
    if seed not in candidates:
        seed = min(candidates, key=lambda point: (point[0] - seed[0]) ** 2 + (point[1] - seed[1]) ** 2)
    candidates.remove(seed)
    region = {seed}
    queue = deque([seed])
    while queue:
        x, y = queue.popleft()
        for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if point in candidates:
                candidates.remove(point)
                region.add(point)
                queue.append(point)
    return region


def recolor_hair(
    source: Path,
    destination: Path,
    bounds: tuple[int, int, int, int],
    seed: tuple[int, int],
) -> None:
    image = Image.open(source).convert("RGBA")
    result = image.copy()
    region = seeded_hair_region(image, bounds, seed)
    pixels = result.load()
    source_pixels = image.load()

    luminances = [sum(source_pixels[x, y][:3]) / 3 for x, y in region]
    low, high = min(luminances), max(luminances)
    span = max(1, high - low)
    for x, y in region:
        red, green, blue, alpha = source_pixels[x, y]
        luminance = (red + green + blue) / 3
        normalized = (luminance - low) / span
        # Charcoal black with cool-gray highlights; retain source shading.
        value = round(22 + normalized * 50)
        pixels[x, y] = (value, value, min(82, value + 7), alpha)

    destination.parent.mkdir(parents=True, exist_ok=True)
    result.save(destination, format="PNG")
    print(f"Wrote {destination} ({len(region)} recolored pixels)")


def main() -> None:
    base_directory = ROOT / "public" / "sprites" / "avatar" / "base"
    production_files = sorted(base_directory.glob("girl_*.png"))
    if len(production_files) != 104:
        raise ValueError(f"Expected 104 complete girl frames, found {len(production_files)}")

    for source in production_files:
        recolor_hair(
            source,
            PRODUCTION_OUTPUT / source.name,
            (20, 5, 140, 112),
            (80, 25),
        )

    # Human-friendly representative preview for design review.
    recolor_hair(
        ROOT / "public" / "sprites" / "avatar" / "base" / "girl_study_01.png",
        OUTPUT / "girl-study-black-hair.png",
        (20, 5, 140, 105),
        (80, 25),
    )
    # Full-room scenes contain similar connected browns in the wall and
    # furniture, so they must be produced as identity-preserving image edits
    # rather than by this palette-only character helper.


if __name__ == "__main__":
    main()
