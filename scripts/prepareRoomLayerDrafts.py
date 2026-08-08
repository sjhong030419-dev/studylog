"""Prepare approved room-layer sources for the 640x800 runtime canvas."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageOps


# Some bundled Windows Python builds decode a Korean script path through the
# active code page. Prefer the caller's project cwd (the documented invocation
# is from the repository root), while retaining a safe direct-run fallback.
ROOT = Path.cwd() if (Path.cwd() / "package.json").exists() else Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "docs" / "assets" / "room-layer-sources" / "v1"
SOURCE_DIR_V2 = ROOT / "docs" / "assets" / "room-layer-sources" / "v2"
OUTPUT_DIR = ROOT / "public" / "sprites" / "room" / "default-night"
PREVIEW_DIR = ROOT / "docs" / "assets" / "room-layer-drafts" / "v1"
CANVAS_SIZE = (640, 800)


def cover_to_canvas(source: Image.Image) -> Image.Image:
    """Match FullSceneRoomRenderer's object-cover/object-center crop."""
    return ImageOps.fit(
        source.convert("RGBA"),
        CANVAS_SIZE,
        method=Image.Resampling.NEAREST,
        centering=(0.5, 0.5),
    )


def place_object(source: Image.Image, box: tuple[int, int, int, int]) -> Image.Image:
    """Crop transparent padding, contain the object in `box`, and keep pixel edges crisp."""
    source = source.convert("RGBA")
    alpha_box = source.getchannel("A").getbbox()
    if alpha_box is None:
        raise ValueError("Room object source has no visible pixels")
    cropped = source.crop(alpha_box)
    x0, y0, x1, y1 = box
    fitted = ImageOps.contain(
        cropped,
        (x1 - x0, y1 - y0),
        method=Image.Resampling.NEAREST,
    )
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    x = x0 + ((x1 - x0) - fitted.width) // 2
    y = y1 - fitted.height
    canvas.alpha_composite(fitted, (x, y))
    return canvas


def sheet_quadrant(source: Image.Image, column: int, row: int) -> Image.Image:
    """Extract one cell from a clean 2x2 generated asset sheet."""
    width, height = source.size
    cell_width, cell_height = width // 2, height // 2
    return source.crop(
        (
            column * cell_width,
            row * cell_height,
            (column + 1) * cell_width,
            (row + 1) * cell_height,
        )
    )


def sheet_half(source: Image.Image, column: int) -> Image.Image:
    half_width = source.width // 2
    return source.crop((column * half_width, 0, (column + 1) * half_width, source.height))


def harden_pixel_alpha(source: Image.Image, cutoff: int = 150) -> Image.Image:
    """Remove chroma fringe while retaining the intentionally crisp pixel silhouette."""
    image = source.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in image.getdata():
        pixels.append((red, green, blue, 255 if alpha >= cutoff else 0))
    image.putdata(pixels)
    return image


def make_lighting_layers() -> tuple[Image.Image, Image.Image]:
    """Create subtle stepped pixel lighting without baking it into furniture."""
    small_size = (160, 200)
    glow = Image.new("RGBA", small_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    # A restrained warm cone from the left desk lamp toward the open book
    # area. Nested polygons give a soft-looking but still pixel-crisp falloff.
    draw.polygon([(39, 91), (91, 123), (72, 136)], fill=(255, 196, 91, 13))
    draw.polygon([(39, 91), (78, 119), (65, 130)], fill=(255, 211, 121, 17))
    draw.ellipse((30, 82, 48, 101), fill=(255, 218, 133, 20))

    foreground = Image.new("RGBA", small_size, (0, 0, 0, 0))
    fg = ImageDraw.Draw(foreground)
    # Very light lower-corner framing; deliberately avoids covering the desk
    # or avatar and gives the scene a finished game-card depth.
    fg.polygon([(0, 169), (0, 200), (34, 200)], fill=(39, 18, 48, 22))
    fg.polygon([(160, 166), (160, 200), (128, 200)], fill=(39, 18, 48, 20))

    return (
        glow.resize(CANVAS_SIZE, Image.Resampling.NEAREST),
        foreground.resize(CANVAS_SIZE, Image.Resampling.NEAREST),
    )


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    background_source = Image.open(SOURCE_DIR / "empty-room-background-source.png")
    background = cover_to_canvas(background_source)
    output = OUTPUT_DIR / "background.png"
    background.save(output, format="PNG")
    print(f"Wrote {output} ({background.width}x{background.height}, {background.mode})")

    full_canvas_layers = {
        "window-night.png": "window-night-alpha.png",
        "shelf.png": "shelf-alpha.png",
        "rug.png": "rug-alpha.png",
    }
    prepared_layers: dict[str, Image.Image] = {}
    for output_name, source_name in full_canvas_layers.items():
        layer_source = Image.open(SOURCE_DIR / source_name).convert("RGBA")
        layer = cover_to_canvas(layer_source)
        layer_output = OUTPUT_DIR / output_name
        layer.save(layer_output, format="PNG")
        prepared_layers[output_name] = layer
        print(f"Wrote {layer_output} ({layer.width}x{layer.height}, {layer.mode})")

    object_layers = {
        # The chair belongs behind the avatar. Its seat deliberately reaches
        # behind the desk so no lower-body seam is visible.
        "desk-back.png": ("desk-back-chair-alpha.png", (285, 205, 515, 655)),
        # Both state variants start from the same approved desk art. Keeping
        # separate files preserves the manifest's state contract and allows a
        # study-specific redraw later without touching renderer code.
        "desk-front.png": ("desk-front-alpha.png", (5, 395, 635, 745)),
        "desk-front-study.png": ("desk-front-alpha.png", (5, 395, 635, 745)),
    }
    for output_name, (source_name, box) in object_layers.items():
        layer = place_object(Image.open(SOURCE_DIR / source_name), box)
        layer_output = OUTPUT_DIR / output_name
        layer.save(layer_output, format="PNG")
        prepared_layers[output_name] = layer
        print(f"Wrote {layer_output} ({layer.width}x{layer.height}, {layer.mode})")

    prop_sheet = Image.open(SOURCE_DIR / "desk-props-sheet-alpha.png").convert("RGBA")
    prop_layers = {
        # lamp (top-left) is intentionally excluded: the generated concept
        # merged it with a plant, which would violate the plant level gate.
        "books.png": (sheet_quadrant(prop_sheet, 1, 0), (455, 350, 625, 490)),
        "mug.png": (sheet_quadrant(prop_sheet, 0, 1), (485, 375, 580, 485)),
        "stationery.png": (sheet_quadrant(prop_sheet, 1, 1), (65, 360, 155, 485)),
    }
    for output_name, (source, box) in prop_layers.items():
        layer = place_object(source, box)
        layer_output = OUTPUT_DIR / output_name
        layer.save(layer_output, format="PNG")
        prepared_layers[output_name] = layer
        print(f"Wrote {layer_output} ({layer.width}x{layer.height}, {layer.mode})")

    reward_sheet = harden_pixel_alpha(Image.open(SOURCE_DIR / "rewards-sheet-alpha.png"))
    reward_layers = {
        "plant.png": (reward_sheet.crop((0, 0, reward_sheet.width // 2, reward_sheet.height)), (130, 355, 205, 490)),
        "cat.png": (reward_sheet.crop((reward_sheet.width // 2, 0, reward_sheet.width, reward_sheet.height)), (25, 625, 190, 755)),
        # Reserved shop slot. It is intentionally not sold or equipped yet;
        # this smaller alternate placement only completes the asset contract.
        "desk-prop-plant-pot.png": (
            reward_sheet.crop((0, 0, reward_sheet.width // 2, reward_sheet.height)),
            (295, 385, 365, 490),
        ),
    }
    for output_name, (source, box) in reward_layers.items():
        layer = place_object(source, box)
        layer_output = OUTPUT_DIR / output_name
        layer.save(layer_output, format="PNG")
        prepared_layers[output_name] = layer
        print(f"Wrote {layer_output} ({layer.width}x{layer.height}, {layer.mode})")

    lamp = place_object(Image.open(SOURCE_DIR / "lamp-alpha.png"), (20, 285, 200, 495))
    lamp.save(OUTPUT_DIR / "lamp.png", format="PNG")
    prepared_layers["lamp.png"] = lamp
    print(f"Wrote {OUTPUT_DIR / 'lamp.png'} ({lamp.width}x{lamp.height}, {lamp.mode})")

    lamp_glow, foreground = make_lighting_layers()
    lamp_glow.save(OUTPUT_DIR / "lamp-glow.png", format="PNG")
    foreground.save(OUTPUT_DIR / "foreground.png", format="PNG")
    prepared_layers["lamp-glow.png"] = lamp_glow
    prepared_layers["foreground.png"] = foreground
    print(f"Wrote {OUTPUT_DIR / 'lamp-glow.png'} ({lamp_glow.width}x{lamp_glow.height}, {lamp_glow.mode})")
    print(f"Wrote {OUTPUT_DIR / 'foreground.png'} ({foreground.width}x{foreground.height}, {foreground.mode})")

    study_sheet = Image.open(SOURCE_DIR_V2 / "study-tools-sheet-alpha.png").convert("RGBA")
    study_tools = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    # The notebook sits below the dedicated study-hands layer. The pencil is
    # already held by that layer, so do not draw it again here.
    study_tools.alpha_composite(place_object(sheet_half(study_sheet, 0), (255, 448, 385, 505)))
    study_tools.save(OUTPUT_DIR / "study-tools.png", format="PNG")
    prepared_layers["study-tools.png"] = study_tools
    print(f"Wrote {OUTPUT_DIR / 'study-tools.png'} ({study_tools.width}x{study_tools.height}, {study_tools.mode})")

    composite = background.copy()
    for name in ("rug.png", "window-night.png", "shelf.png", "desk-back.png"):
        composite.alpha_composite(prepared_layers[name])
    preview_before_desk = composite.copy()
    composite.alpha_composite(prepared_layers["desk-front-study.png"])
    for name in ("lamp.png", "books.png", "mug.png", "stationery.png", "plant.png", "cat.png", "foreground.png", "lamp-glow.png"):
        composite.alpha_composite(prepared_layers[name])
    preview_output = PREVIEW_DIR / "preview-background-furniture-v1.png"
    composite.save(preview_output, format="PNG")
    print(f"Wrote {preview_output}")

    # Useful for checking the intended avatar slot without baking any avatar
    # pixels into production room assets.
    preview_before_desk.save(PREVIEW_DIR / "preview-behind-character-v1.png", format="PNG")


if __name__ == "__main__":
    main()
