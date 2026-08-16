"""Build the review-only 104-frame sakura-uniform candidate family.

Output stays under docs/assets until visual approval. It deliberately
preserves the base image alpha and geometry and changes only cool-colored
clothing pixels inside one of four pose masks.
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "public" / "sprites" / "avatar" / "base"
OUT = ROOT / "docs" / "assets" / "skin-candidates" / "sakura-uniform-v1"

STATE_COUNTS = {
    "idle": 8,
    "study": 10,
    "thinking": 6,
    "reading": 6,
    "typing": 8,
    "break": 4,
    "sleep": 8,
    "happy": 10,
    "excited": 8,
    "celebrate": 12,
    "levelup": 12,
    "focused": 8,
    "away": 4,
}

POSE_BY_STATE = {
    "idle": "standing",
    "thinking": "standing",
    "break": "standing",
    "away": "standing",
    "study": "desk",
    "reading": "desk",
    "typing": "desk",
    "focused": "desk",
    "sleep": "sleep",
    "happy": "celebrate",
    "excited": "celebrate",
    "celebrate": "celebrate",
    "levelup": "celebrate",
}

CREAM = (247, 235, 221)
SAKURA = (201, 120, 134)
CHARCOAL = (75, 69, 74)


def in_box(x: int, y: int, box: tuple[int, int, int, int]) -> bool:
    left, top, right, bottom = box
    return left <= x < right and top <= y < bottom


def is_cool_clothing(rgb: tuple[int, int, int]) -> bool:
    r, g, b = rgb
    return b >= r + 7 and g >= r + 5 and b >= 65


def tint(rgb: tuple[int, int, int], target: tuple[int, int, int]) -> tuple[int, int, int]:
    luminance = sum(rgb) / 3
    factor = max(0.43, min(1.15, luminance / 170))
    return tuple(max(0, min(255, round(channel * factor))) for channel in target)


def target_for_pixel(pose: str, x: int, y: int) -> tuple[int, int, int] | None:
    # Preserve the existing blue-gray hair clip in all poses.
    if in_box(x, y, (96, 32, 125, 72)):
        return None

    if pose == "desk":
        if in_box(x, y, (31, 66, 129, 119)):
            return SAKURA if in_box(x, y, (61, 69, 100, 103)) else CREAM
        return None

    if pose == "sleep":
        # Preserve the blue Zzz effect at the upper left.
        if in_box(x, y, (8, 8, 53, 70)):
            return None
        if in_box(x, y, (38, 67, 122, 115)):
            return SAKURA if in_box(x, y, (63, 70, 99, 102)) else CREAM
        if in_box(x, y, (47, 105, 113, 137)):
            return CHARCOAL
        if in_box(x, y, (42, 130, 119, 160)):
            return SAKURA
        return None

    if pose == "celebrate":
        if in_box(x, y, (17, 45, 143, 108)):
            return SAKURA if in_box(x, y, (63, 70, 99, 101)) else CREAM
        if in_box(x, y, (47, 101, 113, 137)):
            return CHARCOAL
        if in_box(x, y, (42, 130, 119, 160)):
            return SAKURA
        return None

    # standing
    if in_box(x, y, (42, 73, 118, 112)):
        return SAKURA if in_box(x, y, (65, 75, 96, 101)) else CREAM
    if in_box(x, y, (48, 104, 112, 136)):
        return CHARCOAL
    if in_box(x, y, (43, 130, 117, 160)):
        return SAKURA
    return None


def transform(source: Image.Image, pose: str) -> Image.Image:
    image = source.convert("RGBA").copy()
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if not a or not is_cool_clothing((r, g, b)):
                continue
            target = target_for_pixel(pose, x, y)
            if target:
                pixels[x, y] = (*tint((r, g, b), target), a)
    return image


def make_contact_sheet(state: str, frames: list[Image.Image]) -> None:
    scale = 3
    cell = 160 * scale
    columns = 4
    rows = (len(frames) + columns - 1) // columns
    header = 42
    sheet = Image.new("RGB", (columns * cell, header + rows * cell), (247, 239, 230))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 12), f"sakura-uniform candidate / {state} / {len(frames)} frames", fill=(75, 69, 74))
    for index, frame in enumerate(frames):
        x = (index % columns) * cell
        y = header + (index // columns) * cell
        enlarged = frame.resize((cell, cell), Image.Resampling.NEAREST)
        sheet.paste(enlarged, (x, y), enlarged)
    sheet.save(OUT / "contact-sheets" / f"{state}.png")


def main() -> None:
    frames_out = OUT / "frames"
    sheets_out = OUT / "contact-sheets"
    frames_out.mkdir(parents=True, exist_ok=True)
    sheets_out.mkdir(parents=True, exist_ok=True)

    overview_frames: list[tuple[str, Image.Image]] = []
    total = 0
    for state, count in STATE_COUNTS.items():
        pose = POSE_BY_STATE[state]
        state_frames: list[Image.Image] = []
        for frame_number in range(1, count + 1):
            filename = f"girl_{state}_{frame_number:02d}.png"
            source = Image.open(BASE / filename)
            candidate = transform(source, pose)
            candidate.save(frames_out / filename)
            state_frames.append(candidate)
            total += 1
        overview_frames.append((state, state_frames[0]))
        make_contact_sheet(state, state_frames)

    scale = 3
    cell = 160 * scale
    columns = 4
    rows = (len(overview_frames) + columns - 1) // columns
    header = 42
    overview = Image.new("RGB", (columns * cell, header + rows * cell), (247, 239, 230))
    draw = ImageDraw.Draw(overview)
    draw.text((12, 12), f"sakura-uniform / all states / {total} candidate frames", fill=(75, 69, 74))
    for index, (state, frame) in enumerate(overview_frames):
        x = (index % columns) * cell
        y = header + (index // columns) * cell
        enlarged = frame.resize((cell, cell), Image.Resampling.NEAREST)
        overview.paste(enlarged, (x, y), enlarged)
        draw.rectangle((x + 4, y + 4, x + 118, y + 28), fill=(247, 239, 230))
        draw.text((x + 10, y + 10), state, fill=(75, 69, 74))
    overview.save(OUT / "all-states-overview.png")
    print(f"Built {total} candidate frames in {OUT}")


if __name__ == "__main__":
    main()
