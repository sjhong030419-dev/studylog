"""Export approved 4x2 StudyLog concept sheets into runtime WebP assets.

The source masters remain untouched under docs/assets. Each cell is cropped
from deterministic quarter boundaries, then normalized to the dimensions used
by FullSceneRoomRenderer. Shop previews are derived from the same study-state
cells, so the store never advertises different artwork from the equipped skin.
"""

from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "docs" / "assets" / "skin-concepts-batch-v1"
ROOM_ROOT = ROOT / "public" / "sprites" / "room"
SHOP_ROOT = ROOT / "public" / "sprites" / "shop"

THEMES = (
    "autumn-forest-bookshop-v1",
    "ocean-glasshouse-library-v1",
    "snowy-reading-cabin-v1",
    "hanok-dawn-study-v1",
    "neon-study-arcade-v1",
    "celestial-observatory-academy-v1",
)
STATES = ("idle", "study", "sleep", "happy")
GENDERS = ("girl", "boy")


def quarter_box(width: int, height: int, column: int, row: int) -> tuple[int, int, int, int]:
    x0 = round(width * column / 4)
    x1 = round(width * (column + 1) / 4)
    y0 = round(height * row / 2)
    y1 = round(height * (row + 1) / 2)
    return x0, y0, x1, y1


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def save_webp(image: Image.Image, path: Path, quality: int = 86) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=quality, method=6)


for theme in THEMES:
    source_path = SOURCE_ROOT / theme / "room-contact-sheet-original.png"
    with Image.open(source_path) as sheet:
        cells: dict[tuple[str, str], Image.Image] = {}
        for row, gender in enumerate(GENDERS):
            for column, state in enumerate(STATES):
                cell = sheet.crop(quarter_box(sheet.width, sheet.height, column, row)).convert("RGB")
                cells[(gender, state)] = cell
                scene = cover(cell, (640, 800))
                save_webp(scene, ROOM_ROOT / theme / "scenes" / gender / f"{state}.webp")

        girl_study = cover(cells[("girl", "study")], (480, 480))
        boy_study = cover(cells[("boy", "study")], (480, 480))
        banner = Image.new("RGB", (960, 480))
        banner.paste(girl_study, (0, 0))
        banner.paste(boy_study, (480, 0))

        save_webp(banner, SHOP_ROOT / theme / "banner.webp", quality=88)
        save_webp(girl_study, SHOP_ROOT / theme / "thumbnail.webp", quality=86)
        save_webp(cover(girl_study, (128, 128)), SHOP_ROOT / theme / "icon.webp", quality=82)

print(f"Exported {len(THEMES)} themes: {len(THEMES) * 8} scenes and {len(THEMES) * 3} shop previews")
