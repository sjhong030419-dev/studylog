"""Validate the review-only sakura-uniform candidate family."""

from pathlib import Path
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "public" / "sprites" / "avatar" / "base"
CANDIDATES = ROOT / "docs" / "assets" / "skin-candidates" / "sakura-uniform-v1" / "frames"

STATE_COUNTS = {
    "idle": 8, "study": 10, "thinking": 6, "reading": 6,
    "typing": 8, "break": 4, "sleep": 8, "happy": 10,
    "excited": 8, "celebrate": 12, "levelup": 12, "focused": 8,
    "away": 4,
}


def main() -> None:
    expected = [
        f"girl_{state}_{frame:02d}.png"
        for state, count in STATE_COUNTS.items()
        for frame in range(1, count + 1)
    ]
    issues: list[str] = []
    changed_counts: list[int] = []
    for filename in expected:
        candidate_path = CANDIDATES / filename
        if not candidate_path.exists():
            issues.append(f"missing: {filename}")
            continue
        base = Image.open(BASE / filename).convert("RGBA")
        candidate = Image.open(candidate_path).convert("RGBA")
        if candidate.size != (160, 160):
            issues.append(f"wrong size: {filename} {candidate.size}")
        if candidate.getchannel("A").tobytes() != base.getchannel("A").tobytes():
            issues.append(f"alpha drift: {filename}")
        rgb_diff = ImageChops.difference(base.convert("RGB"), candidate.convert("RGB"))
        changed = sum(1 for pixel in rgb_diff.get_flattened_data() if any(pixel))
        changed_counts.append(changed)
        if changed == 0:
            issues.append(f"no clothing change: {filename}")

    extra = sorted(path.name for path in CANDIDATES.glob("*.png") if path.name not in expected)
    issues.extend(f"unexpected: {filename}" for filename in extra)

    print(f"Expected: {len(expected)}")
    print(f"Present: {sum((CANDIDATES / name).exists() for name in expected)}")
    print(f"Changed pixels: min={min(changed_counts)} max={max(changed_counts)}")
    print(f"Issues: {len(issues)}")
    for issue in issues:
        print(f"- {issue}")
    raise SystemExit(1 if issues else 0)


if __name__ == "__main__":
    main()
