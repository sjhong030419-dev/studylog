"""Build geometry-locked 160px sakura-uniform color proofs.

These are review proofs, not production sprite delivery. The script edits
only clothing-colored pixels inside explicit pose-specific masks, preserving
the source alpha, coordinates, face, hair, hands, and props byte-for-byte
outside those masks.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "public" / "sprites" / "avatar" / "base"
OUT = ROOT / "docs" / "assets" / "skin-proofs" / "sakura-uniform-v1"

CREAM = (247, 235, 221)
SAKURA = (201, 120, 134)
CHARCOAL = (75, 69, 74)


def is_cool_clothing(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return b >= r + 7 and g >= r + 5 and b >= 65


def tint(rgb: tuple[int, int, int], target: tuple[int, int, int]) -> tuple[int, int, int]:
    luminance = sum(rgb) / 3
    factor = max(0.43, min(1.15, luminance / 170))
    return tuple(max(0, min(255, round(channel * factor))) for channel in target)


def in_box(x: int, y: int, box: tuple[int, int, int, int]) -> bool:
    left, top, right, bottom = box
    return left <= x < right and top <= y < bottom


def build_idle() -> Image.Image:
    image = Image.open(BASE / "girl_idle_01.png").convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if not a or not is_cool_clothing((r, g, b)):
                continue
            target = None
            if in_box(x, y, (42, 73, 118, 112)):
                target = SAKURA if in_box(x, y, (65, 75, 96, 101)) else CREAM
            elif in_box(x, y, (48, 104, 112, 136)):
                target = CHARCOAL
            elif in_box(x, y, (43, 130, 117, 159)):
                target = SAKURA
            if target:
                pixels[x, y] = (*tint((r, g, b), target), a)
    return image


def build_study() -> Image.Image:
    image = Image.open(BASE / "girl_study_01.png").convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if not a or not is_cool_clothing((r, g, b)):
                continue
            target = None
            if in_box(x, y, (31, 66, 129, 119)):
                target = SAKURA if in_box(x, y, (61, 69, 100, 103)) else CREAM
            if target:
                pixels[x, y] = (*tint((r, g, b), target), a)
    return image


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    idle = build_idle()
    study = build_study()
    idle.save(OUT / "girl_idle_01-proof.png")
    study.save(OUT / "girl_study_01-proof.png")

    board = Image.new("RGBA", (640, 320), (247, 239, 230, 255))
    idle_large = idle.resize((320, 320), Image.Resampling.NEAREST)
    study_large = study.resize((320, 320), Image.Resampling.NEAREST)
    board.alpha_composite(idle_large, (0, 0))
    board.alpha_composite(study_large, (320, 0))
    board.convert("RGB").save(OUT / "sakura-uniform-proof-board.png")


if __name__ == "__main__":
    main()
