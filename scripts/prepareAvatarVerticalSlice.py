"""Build the non-runtime girl/study layered-avatar vertical slice at 160x160."""

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


ROOT = Path.cwd() if (Path.cwd() / "package.json").exists() else Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "docs" / "assets" / "cosmetic-sources" / "v2"
OUTPUT_ROOT = ROOT / "public" / "sprites" / "avatar-layers"
PREVIEW_DIR = ROOT / "docs" / "assets" / "cosmetic-drafts" / "v2" / "girl" / "study"
LEGACY_DRAFT_DIR = ROOT / "docs" / "assets" / "cosmetic-drafts" / "v1" / "girl" / "study"
CANVAS_SIZE = (160, 160)
SOURCE_CROP = (127, 100, 1127, 1100)
ROOM_ALIGNMENT_OFFSET_Y = 8


def remove_connected_green(source: Image.Image) -> Image.Image:
    """Remove only green pixels connected to the canvas edge.

    A flood fill is safer than global chroma distance for dusty-blue clothes:
    it cannot accidentally punch transparent holes inside an enclosed outfit.
    """
    image = source.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_key(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return green >= red + 22 and green >= blue + 22 and green >= 90

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if seen[index] or not is_key(x, y):
            return
        seen[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    return image


def normalize(source_name: str) -> Image.Image:
    image = remove_connected_green(Image.open(SOURCE_DIR / source_name))
    resized = image.crop(SOURCE_CROP).resize(CANVAS_SIZE, Image.Resampling.NEAREST)
    pixels = resized.load()
    for y in range(resized.height):
        for x in range(resized.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha and green >= red + 35 and green >= blue + 35:
                pixels[x, y] = (0, 0, 0, 0)
    aligned = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    aligned.alpha_composite(resized, (0, ROOM_ALIGNMENT_OFFSET_Y))
    return aligned


def align_existing_layer(source: Image.Image, scale: float = 1.25) -> Image.Image:
    scaled_size = round(CANVAS_SIZE[0] * scale), round(CANVAS_SIZE[1] * scale)
    scaled = source.convert("RGBA").resize(scaled_size, Image.Resampling.NEAREST)
    crop_x = (scaled.width - CANVAS_SIZE[0]) // 2
    crop_y = (scaled.height - CANVAS_SIZE[1]) // 2
    scaled = scaled.crop((crop_x, crop_y, crop_x + CANVAS_SIZE[0], crop_y + CANVAS_SIZE[1]))
    aligned = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (0, ROOM_ALIGNMENT_OFFSET_Y))
    return aligned


def difference_layer(
    target: Image.Image,
    reference: Image.Image,
    *,
    min_y: int,
    max_y: int,
    preserve_skin: bool,
) -> Image.Image:
    difference = ImageChops.difference(target.convert("RGB"), reference.convert("RGB")).convert("L")
    mask = difference.point(lambda value: 255 if value >= 26 else 0).filter(ImageFilter.MaxFilter(3))
    result = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    target_pixels = target.load()
    target_alpha = target.getchannel("A").load()
    mask_pixels = mask.load()
    result_pixels = result.load()

    for y in range(min_y, max_y + 1):
        for x in range(CANVAS_SIZE[0]):
            if mask_pixels[x, y] == 0 or target_alpha[x, y] == 0:
                continue
            red, green, blue, alpha = target_pixels[x, y]
            looks_like_skin = red > 170 and red >= green + 18 and green >= blue - 5 and blue < 205
            if preserve_skin and looks_like_skin:
                continue
            result_pixels[x, y] = (red, green, blue, alpha)
    return result


def save_layer(layer: Image.Image, relative_path: str) -> None:
    output = OUTPUT_ROOT / relative_path
    output.parent.mkdir(parents=True, exist_ok=True)
    layer.save(output, format="PNG")
    print(f"Wrote {output} ({layer.width}x{layer.height}, {layer.mode})")


def main() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    bare = normalize("girl-study-bare-chroma.png")
    hair_composite = normalize("girl-study-default-hair-composite-chroma.png")
    default_composite = normalize("girl-study-default-outfit-composite-chroma.png")
    hoodie_composite = normalize("girl-study-hoodie-composite-chroma.png")

    hair_front = difference_layer(hair_composite, bare, min_y=10, max_y=96, preserve_skin=True)
    hair_back = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    default_outfit = difference_layer(default_composite, hair_composite, min_y=72, max_y=135, preserve_skin=True)
    hoodie = difference_layer(hoodie_composite, hair_composite, min_y=72, max_y=138, preserve_skin=True)
    ribbon = align_existing_layer(Image.open(LEGACY_DRAFT_DIR / "lavender-ribbon.png"))
    glasses = align_existing_layer(Image.open(LEGACY_DRAFT_DIR / "round-glasses.png"))
    headphones = align_existing_layer(Image.open(LEGACY_DRAFT_DIR / "lavender-headphones.png"))

    save_layer(bare, "base/girl/study.png")
    save_layer(hair_back, "hair-back/default-hair/girl/study.png")
    save_layer(hair_front, "hair-front/default-hair/girl/study.png")
    save_layer(default_outfit, "outfit/default-outfit/girl/study.png")
    save_layer(hoodie, "outfit/hoodie/girl/study.png")
    save_layer(ribbon, "head-accessory/ribbon/girl/study.png")
    save_layer(glasses, "face-accessory/glasses/girl/study.png")
    save_layer(headphones, "head-accessory/headphones/girl/study.png")

    default_character = Image.alpha_composite(Image.alpha_composite(bare, hair_front), default_outfit)
    hoodie_character = Image.alpha_composite(Image.alpha_composite(bare, hair_front), hoodie)
    previews = {
        "bare.png": bare,
        "default-hair.png": Image.alpha_composite(bare, hair_front),
        "default-outfit.png": default_character,
        "hoodie.png": hoodie_character,
        "hoodie-ribbon.png": Image.alpha_composite(hoodie_character, ribbon),
        "default-glasses.png": Image.alpha_composite(default_character, glasses),
        "default-headphones.png": Image.alpha_composite(default_character, headphones),
    }
    for name, preview in previews.items():
        preview.save(PREVIEW_DIR / name, format="PNG")
        print(f"Wrote {PREVIEW_DIR / name}")

    room_output = ROOT / "public" / "sprites" / "room" / "default-night"
    behind_room = Image.open(
        ROOT / "docs" / "assets" / "room-layer-drafts" / "v1" / "preview-behind-character-v1.png"
    ).convert("RGBA")

    def room_preview(character: Image.Image, name: str) -> None:
        scene = behind_room.copy()
        rendered_character = character.resize((360, 360), Image.Resampling.NEAREST)
        scene.alpha_composite(rendered_character, (140, 128))
        for layer_name in (
            "desk-front-study.png",
            "lamp.png",
            "books.png",
            "mug.png",
            "stationery.png",
            "plant.png",
            "cat.png",
            "foreground.png",
            "lamp-glow.png",
        ):
            scene.alpha_composite(Image.open(room_output / layer_name).convert("RGBA"))
        scene.save(PREVIEW_DIR / name, format="PNG")
        print(f"Wrote {PREVIEW_DIR / name}")

    room_preview(default_character, "room-default-outfit.png")
    room_preview(Image.alpha_composite(hoodie_character, ribbon), "room-hoodie-ribbon.png")


if __name__ == "__main__":
    main()
