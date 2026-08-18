from pathlib import Path
import re

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'docs/assets/skin-candidates/sakura-uniform-ribbon-v1/avatar'
BASE = ROOT / 'public/sprites/avatar/whole/sakura-uniform'
OUT = ROOT / 'public/sprites/avatar/whole/sakura-uniform-ribbon'
ROOM_RAW = ROOT / 'docs/assets/skin-candidates/sakura-uniform-ribbon-v1/room'
ROOM_OUT = ROOT / 'public/sprites/room/sakura-uniform-ribbon/scenes'

POSE_BY_STATE = {
    'idle': 'idle', 'thinking': 'idle', 'break': 'idle', 'away': 'idle',
    'study': 'study', 'reading': 'study', 'typing': 'study', 'focused': 'study',
    'sleep': 'sleep',
    'happy': 'happy', 'excited': 'happy', 'celebrate': 'happy', 'levelup': 'happy',
}


def remove_chroma(image: Image.Image) -> Image.Image:
    rgba = image.convert('RGBA')
    pixels = []
    for red, green, blue, _ in rgba.getdata():
        is_green = green > 105 and green > red * 1.32 and green > blue * 1.32
        pixels.append((0, 0, 0, 0) if is_green else (red, green, blue, 255))
    rgba.putdata(pixels)
    bbox = rgba.getbbox()
    if bbox is None:
        raise ValueError('Chroma removal produced an empty image')
    return rgba.crop(bbox)


def fit_to_reference(subject: Image.Image, reference: Image.Image) -> Image.Image:
    target_bbox = reference.convert('RGBA').getbbox()
    if target_bbox is None:
        raise ValueError('Reference sprite is empty')
    target_size = (target_bbox[2] - target_bbox[0], target_bbox[3] - target_bbox[1])
    fitted = ImageOps.contain(subject, target_size, Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
    left = target_bbox[0] + (target_size[0] - fitted.width) // 2
    top = target_bbox[1] + (target_size[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (left, top))
    return canvas


def build_avatar_family() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    masters = {
        (gender, pose): remove_chroma(Image.open(RAW / gender / f'{pose}.png'))
        for gender in ('girl', 'boy')
        for pose in ('idle', 'study', 'sleep', 'happy')
    }
    # The generated boy study master includes the lower desk legs for the
    # full-room composition. The 160px whole-avatar contract intentionally
    # keeps only the tabletop, matching the existing sakura study sprite.
    boy_study = masters[('boy', 'study')]
    masters[('boy', 'study')] = boy_study.crop((0, 0, boy_study.width, int(boy_study.height * 0.73)))
    pattern = re.compile(r'^(girl|boy)_([a-z]+)_(\d+)\.png$')
    for reference_path in sorted(BASE.glob('*.png')):
        match = pattern.match(reference_path.name)
        if not match:
            continue
        gender, state, _frame = match.groups()
        pose = POSE_BY_STATE[state]
        result = fit_to_reference(masters[(gender, pose)], Image.open(reference_path))
        result.save(OUT / reference_path.name, optimize=True)


def build_room_family() -> None:
    for gender in ('girl', 'boy'):
        destination = ROOM_OUT / gender
        destination.mkdir(parents=True, exist_ok=True)
        for scene in ('idle', 'study', 'sleep', 'happy'):
            image = Image.open(ROOM_RAW / gender / f'{scene}.png').convert('RGB')
            image = ImageOps.fit(image, (640, 800), method=Image.Resampling.LANCZOS)
            image.save(destination / f'{scene}.webp', 'WEBP', quality=88, method=6)


if __name__ == '__main__':
    build_avatar_family()
    build_room_family()
