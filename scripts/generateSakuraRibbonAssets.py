from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
STATES = (
    'idle', 'study', 'thinking', 'reading', 'typing', 'break', 'sleep',
    'happy', 'excited', 'celebrate', 'levelup', 'focused', 'away',
)
POSE_BY_STATE = {
    'thinking': 'idle', 'break': 'idle', 'away': 'idle',
    'reading': 'study', 'typing': 'study', 'focused': 'study',
    'excited': 'happy', 'celebrate': 'happy', 'levelup': 'happy',
}

AVATAR_CENTERS = {
    'girl': {'idle': (108, 38), 'study': (121, 40), 'sleep': (113, 41), 'happy': (110, 36)},
    'boy': {'idle': (105, 35), 'study': (114, 44), 'sleep': (108, 45), 'happy': (106, 37)},
}

ROOM_CENTERS = {
    'default-night': {
        'girl': {'idle': (419, 316), 'study': (415, 319), 'sleep': (403, 342), 'happy': (425, 303)},
        'boy': {'idle': (426, 272), 'study': (430, 280), 'sleep': (416, 300), 'happy': (430, 262)},
    },
    'sakura-uniform': {
        'girl': {'idle': (407, 334), 'study': (401, 338), 'sleep': (407, 337), 'happy': (436, 291)},
        'boy': {'idle': (430, 291), 'study': (421, 301), 'sleep': (405, 316), 'happy': (430, 277)},
    },
}


def draw_bow(size: tuple[int, int]) -> Image.Image:
    """A deterministic pixel bow; nearest-neighbour scaling keeps edges crisp."""
    base = Image.new('RGBA', (24, 18), (0, 0, 0, 0))
    d = ImageDraw.Draw(base)
    outline = '#633724'
    dark = '#b95f73'
    pink = '#e78fa2'
    light = '#ffd0d7'
    cream = '#ffe8d4'

    d.polygon([(1, 4), (4, 1), (10, 4), (10, 12), (5, 16), (1, 13)], fill=outline)
    d.polygon([(23, 4), (20, 1), (14, 4), (14, 12), (19, 16), (23, 13)], fill=outline)
    d.polygon([(3, 5), (5, 3), (10, 6), (9, 11), (5, 13), (3, 11)], fill=pink)
    d.polygon([(21, 5), (19, 3), (14, 6), (15, 11), (19, 13), (21, 11)], fill=pink)
    d.polygon([(5, 13), (10, 11), (10, 17), (7, 15)], fill=outline)
    d.polygon([(19, 13), (14, 11), (14, 17), (17, 15)], fill=outline)
    d.polygon([(7, 12), (10, 10), (9, 15)], fill=dark)
    d.polygon([(17, 12), (14, 10), (15, 15)], fill=dark)
    d.rectangle((9, 5, 15, 12), fill=outline)
    d.rectangle((10, 6, 14, 11), fill=light)
    d.rectangle((11, 7, 13, 10), fill=cream)
    d.rectangle((4, 5, 5, 7), fill=light)
    d.rectangle((18, 5, 19, 7), fill=light)
    return base.resize(size, Image.Resampling.NEAREST)


def place(canvas_size: tuple[int, int], center: tuple[int, int], bow_size: tuple[int, int]) -> Image.Image:
    canvas = Image.new('RGBA', canvas_size, (0, 0, 0, 0))
    bow = draw_bow(bow_size)
    x = center[0] - bow.width // 2
    y = center[1] - bow.height // 2
    canvas.alpha_composite(bow, (x, y))
    return canvas


def main() -> None:
    avatar_root = ROOT / 'public/sprites/avatar-layers/head-accessory/ribbon'
    for gender, centers in AVATAR_CENTERS.items():
        out = avatar_root / gender
        out.mkdir(parents=True, exist_ok=True)
        for state in STATES:
            pose = POSE_BY_STATE.get(state, state)
            place((160, 160), centers[pose], (24, 18)).save(out / f'{state}.png')

    for theme, genders in ROOM_CENTERS.items():
        for gender, centers in genders.items():
            out = ROOT / f'public/sprites/room/{theme}/accessories/ribbon/{gender}'
            out.mkdir(parents=True, exist_ok=True)
            for scene, center in centers.items():
                place((640, 800), center, (48, 36)).save(out / f'{scene}.png')


if __name__ == '__main__':
    main()
