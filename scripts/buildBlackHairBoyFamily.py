"""Build the male black-hair whole-avatar family from approved base art."""
from colorsys import rgb_to_hsv
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "public" / "sprites" / "avatar" / "base"
OUT = ROOT / "public" / "sprites" / "avatar" / "whole" / "black-hair"
PREVIEW = ROOT / "docs" / "assets" / "whole-avatar-previews" / "black-hair" / "boy-all-states.png"
COUNTS = {"idle":8,"study":10,"thinking":6,"reading":6,"typing":8,"break":4,"sleep":8,"happy":10,"excited":8,"celebrate":12,"levelup":12,"focused":8,"away":4}

def transform(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA").copy()
    pixels = image.load()
    for y in range(min(105, image.height)):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if not a: continue
            h, s, v = rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.025 <= h <= 0.13 and s >= 0.28 and v <= 0.78:
                shade = round(18 + v * 70)
                pixels[x, y] = (shade, shade - 2, min(255, shade + 8), a)
    return image

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    first = []
    for state, count in COUNTS.items():
        for n in range(1, count + 1):
            frame = transform(Image.open(BASE / f"boy_{state}_{n:02d}.png"))
            frame.save(OUT / f"boy_{state}_{n:02d}.png")
            if n == 1: first.append((state, frame))
    sheet = Image.new("RGB", (1920, 1962), (247,239,230)); draw = ImageDraw.Draw(sheet)
    draw.text((12,12), "black-hair boy / all states / 104 frames", fill=(75,69,74))
    for i,(state,frame) in enumerate(first):
        x=(i%4)*480; y=42+(i//4)*480
        big=frame.resize((480,480),Image.Resampling.NEAREST); sheet.paste(big,(x,y),big); draw.text((x+10,y+10),state,fill=(75,69,74))
    PREVIEW.parent.mkdir(parents=True,exist_ok=True); sheet.save(PREVIEW)
    print("Built 104 male black-hair frames")

if __name__ == "__main__": main()
