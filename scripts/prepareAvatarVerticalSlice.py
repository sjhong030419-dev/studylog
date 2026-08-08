"""Build the non-runtime girl/study layered-avatar vertical slice at 160x160."""

from collections import deque
from pathlib import Path

from PIL import Image, ImageChops


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


def align_existing_layer(
    source: Image.Image,
    scale: float = 1.25,
    offset_y: int = ROOM_ALIGNMENT_OFFSET_Y,
) -> Image.Image:
    scaled_size = round(CANVAS_SIZE[0] * scale), round(CANVAS_SIZE[1] * scale)
    scaled = source.convert("RGBA").resize(scaled_size, Image.Resampling.NEAREST)
    crop_x = (scaled.width - CANVAS_SIZE[0]) // 2
    crop_y = (scaled.height - CANVAS_SIZE[1]) // 2
    scaled = scaled.crop((crop_x, crop_y, crop_x + CANVAS_SIZE[0], crop_y + CANVAS_SIZE[1]))
    aligned = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    aligned.alpha_composite(scaled, (0, offset_y))
    return aligned


def connected_components(mask: set[tuple[int, int]]) -> list[set[tuple[int, int]]]:
    remaining = set(mask)
    components: list[set[tuple[int, int]]] = []
    while remaining:
        start = remaining.pop()
        component = {start}
        queue = deque([start])
        while queue:
            x, y = queue.popleft()
            for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if point in remaining:
                    remaining.remove(point)
                    component.add(point)
                    queue.append(point)
        components.append(component)
    return components


def render_masked(target: Image.Image, mask: set[tuple[int, int]]) -> Image.Image:
    result = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    source_pixels = target.load()
    result_pixels = result.load()
    for x, y in mask:
        result_pixels[x, y] = source_pixels[x, y]
    return result


def extract_hair_layer(target: Image.Image, bare: Image.Image) -> Image.Image:
    pixels = target.load()
    alpha = target.getchannel("A").load()
    candidates: set[tuple[int, int]] = set()
    for y in range(6, 108):
        for x in range(CANVAS_SIZE[0]):
            red, green, blue, _ = pixels[x, y]
            is_hair_brown = red >= green + 16 and green >= blue + 4 and green < 172 and blue < 145
            if alpha[x, y] and is_hair_brown:
                candidates.add((x, y))

    components = connected_components(candidates)
    hair = max(components, key=len)
    difference = ImageChops.difference(target.convert("RGB"), bare.convert("RGB")).convert("L").load()

    # Add one outline ring around the connected brown silhouette. Eyes and
    # eyebrows are separate islands and therefore never enter this mask.
    outline = set(hair)
    for x, y in tuple(hair):
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < 160 and 0 <= ny < 108 and alpha[nx, ny] and difference[nx, ny] >= 18:
                red, green, blue, _ = pixels[nx, ny]
                is_skin = red > 175 and green > 125 and blue > 95
                if not is_skin:
                    outline.add((nx, ny))
    return render_masked(target, outline)


def extract_outfit_layer(target: Image.Image, reference: Image.Image) -> Image.Image:
    pixels = target.load()
    alpha = target.getchannel("A").load()
    difference = ImageChops.difference(target.convert("RGB"), reference.convert("RGB")).convert("L").load()
    outfit: set[tuple[int, int]] = set()
    for y in range(86, 150):
        for x in range(CANVAS_SIZE[0]):
            if not alpha[x, y] or difference[x, y] < 24:
                continue
            red, green, blue, _ = pixels[x, y]
            is_skin = red > 170 and red >= green + 18 and green >= blue - 5 and blue < 210
            is_hair_brown = red >= green + 16 and green >= blue + 4 and green < 172 and blue < 145
            if not is_skin and not is_hair_brown:
                outfit.add((x, y))

    # Discard tiny regenerated face/hair noise; real garment regions form
    # large connected components (torso, sleeves, blouse, ribbon).
    kept: set[tuple[int, int]] = set()
    for component in connected_components(outfit):
        if len(component) >= 5:
            kept.update(component)
    return render_masked(target, kept)


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

    hair_front = extract_hair_layer(hair_composite, bare)
    hair_back = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    default_outfit = extract_outfit_layer(default_composite, hair_composite)
    hoodie = extract_outfit_layer(hoodie_composite, hair_composite)
    ribbon = align_existing_layer(Image.open(LEGACY_DRAFT_DIR / "lavender-ribbon.png"))
    glasses = align_existing_layer(Image.open(LEGACY_DRAFT_DIR / "round-glasses.png"), scale=1.15, offset_y=25)
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
