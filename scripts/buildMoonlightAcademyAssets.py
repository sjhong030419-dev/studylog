from pathlib import Path
import re

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'docs/assets/skin-candidates/moonlight-academy-v1'
BASE = ROOT / 'public/sprites/avatar/whole/sakura-uniform'
AVATAR_OUT = ROOT / 'public/sprites/avatar/whole/moonlight-academy'
ROOM_OUT = ROOT / 'public/sprites/room/moonlight-academy/scenes'

POSE_BY_STATE = {
    'idle': 'idle', 'thinking': 'idle', 'break': 'idle', 'away': 'idle',
    'study': 'study', 'reading': 'study', 'typing': 'study', 'focused': 'study',
    'sleep': 'sleep',
    'happy': 'happy', 'excited': 'happy', 'celebrate': 'happy', 'levelup': 'happy',
}


def crop_grid(image: Image.Image, columns: int = 4, rows: int = 2):
    for row in range(rows):
        for column in range(columns):
            left = round(image.width * column / columns)
            right = round(image.width * (column + 1) / columns)
            top = round(image.height * row / rows)
            bottom = round(image.height * (row + 1) / rows)
            yield row, column, image.crop((left, top, right, bottom))


def remove_cream_background(image: Image.Image) -> Image.Image:
    rgba = image.convert('RGBA')
    cleaned = []
    for red, green, blue, _alpha in rgba.getdata():
        distance = max(abs(red - 255), abs(green - 249), abs(blue - 240))
        if distance < 20:
            cleaned.append((red, green, blue, 0))
        elif distance < 48:
            alpha = round(255 * (distance - 20) / 28)
            cleaned.append((red, green, blue, alpha))
        else:
            cleaned.append((red, green, blue, 255))
    rgba.putdata(cleaned)
    bbox = rgba.getbbox()
    if bbox is None:
        raise ValueError('Background removal produced an empty image')
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


def build_room_family() -> None:
    source = Image.open(RAW / 'room-contact-sheet.png').convert('RGB')
    poses = ('idle', 'study', 'sleep', 'happy')
    for row, column, panel in crop_grid(source):
        gender = ('girl', 'boy')[row]
        destination = ROOM_OUT / gender
        destination.mkdir(parents=True, exist_ok=True)
        fitted = ImageOps.fit(panel, (640, 800), method=Image.Resampling.LANCZOS)
        fitted.save(destination / f'{poses[column]}.webp', 'WEBP', quality=90, method=6)


def build_avatar_family() -> None:
    source = Image.open(RAW / 'avatar-contact-sheet.png')
    poses = ('idle', 'study', 'sleep', 'happy')
    masters = {}
    for row, column, panel in crop_grid(source):
        gender = ('girl', 'boy')[row]
        masters[(gender, poses[column])] = remove_cream_background(panel)

    AVATAR_OUT.mkdir(parents=True, exist_ok=True)
    pattern = re.compile(r'^(girl|boy)_([a-z]+)_(\d+)\.png$')
    for reference_path in sorted(BASE.glob('*.png')):
        match = pattern.match(reference_path.name)
        if not match:
            continue
        gender, state, _frame = match.groups()
        pose = POSE_BY_STATE[state]
        result = fit_to_reference(masters[(gender, pose)], Image.open(reference_path))
        result.save(AVATAR_OUT / reference_path.name, optimize=True)


if __name__ == '__main__':
    build_avatar_family()
    build_room_family()
