"""Build the review-ready male sakura-uniform whole-avatar family."""

from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets" / "skin-candidates" / "sakura-uniform-boy-v1"
RAW = OUT / "masters" / "raw"

STATE_COUNTS = {
    "idle": 8, "study": 10, "thinking": 6, "reading": 6,
    "typing": 8, "break": 4, "sleep": 8, "happy": 10,
    "excited": 8, "celebrate": 12, "levelup": 12, "focused": 8,
    "away": 4,
}

POSE_BY_STATE = {
    "idle": "standing", "thinking": "standing", "break": "standing", "away": "standing",
    "study": "desk", "reading": "desk", "typing": "desk", "focused": "desk",
    "sleep": "sleep",
    "happy": "celebrate", "excited": "celebrate", "celebrate": "celebrate", "levelup": "celebrate",
}


def is_background(pixel: tuple[int, int, int]) -> bool:
    r, g, b = pixel
    return min(pixel) >= 225 and max(pixel) - min(pixel) <= 14


def extract_foreground(source: Image.Image) -> Image.Image:
    """Flood-remove only bright neutral pixels connected to the canvas edge."""
    rgb = source.convert("RGB")
    width, height = rgb.size
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or not is_background(rgb.getpixel((x, y))):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x: enqueue(x - 1, y)
        if x + 1 < width: enqueue(x + 1, y)
        if y: enqueue(x, y - 1)
        if y + 1 < height: enqueue(x, y + 1)

    rgba = rgb.convert("RGBA")
    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = alpha.load()
    for y in range(height):
        row = y * width
        for x in range(width):
            if visited[row + x]:
                alpha_pixels[x, y] = 0
    rgba.putalpha(alpha)
    return rgba


def fit_sprite(source: Image.Image) -> Image.Image:
    alpha = source.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("master contains no foreground")
    cropped = source.crop(bbox)
    max_size = 150
    scale = min(max_size / cropped.width, max_size / cropped.height)
    size = (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale)))
    resized = cropped.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((160 - size[0]) // 2, (160 - size[1]) // 2))
    return canvas


def contact_sheet(frames: list[tuple[str, Image.Image]], path: Path, title: str) -> None:
    scale = 3
    cell = 160 * scale
    columns = 4
    rows = (len(frames) + columns - 1) // columns
    header = 42
    sheet = Image.new("RGB", (columns * cell, header + rows * cell), (247, 239, 230))
    draw = ImageDraw.Draw(sheet)
    draw.text((12, 12), title, fill=(75, 69, 74))
    for index, (label, frame) in enumerate(frames):
        x = (index % columns) * cell
        y = header + (index // columns) * cell
        enlarged = frame.resize((cell, cell), Image.Resampling.NEAREST)
        sheet.paste(enlarged, (x, y), enlarged)
        draw.rectangle((x + 4, y + 4, x + 118, y + 28), fill=(247, 239, 230))
        draw.text((x + 10, y + 10), label, fill=(75, 69, 74))
    sheet.save(path)


def main() -> None:
    masters_out = OUT / "masters" / "processed"
    frames_out = OUT / "frames"
    masters_out.mkdir(parents=True, exist_ok=True)
    frames_out.mkdir(parents=True, exist_ok=True)

    masters: dict[str, Image.Image] = {}
    for pose in sorted(set(POSE_BY_STATE.values())):
        master = fit_sprite(extract_foreground(Image.open(RAW / f"{pose}.png")))
        master.save(masters_out / f"{pose}.png")
        masters[pose] = master

    overview: list[tuple[str, Image.Image]] = []
    total = 0
    for state, count in STATE_COUNTS.items():
        frame = masters[POSE_BY_STATE[state]]
        overview.append((state, frame))
        for frame_number in range(1, count + 1):
            frame.save(frames_out / f"boy_{state}_{frame_number:02d}.png")
            total += 1

    contact_sheet(overview, OUT / "all-states-overview-processed.png", f"sakura-uniform boy / all states / {total} frames")
    print(f"Built {total} male candidate frames in {OUT}")


if __name__ == "__main__":
    main()
