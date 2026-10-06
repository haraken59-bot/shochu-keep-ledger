"""Generate app icons from the supplied PNG using Pillow (development only)."""
from pathlib import Path
import argparse
import math
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
SOURCE = OUT / "source-20261006.png"
parser = argparse.ArgumentParser()
parser.add_argument("source", nargs="?", type=Path, default=SOURCE)
args = parser.parse_args()
OUT.mkdir(exist_ok=True)
if args.source.resolve() != SOURCE.resolve():
    shutil.copyfile(args.source, SOURCE)
source = Image.open(SOURCE).convert("RGBA")
side = max(source.size)
square = Image.new("RGBA", (side, side))
square.alpha_composite(source, ((side - source.width) // 2, (side - source.height) // 2))
for size in (16, 32, 48, 192, 512):
    square.resize((size, size), Image.Resampling.LANCZOS).save(OUT / f"icon-{size}-20261006.png")

# Every nontransparent source pixel fits inside radius 38%, leaving room
# for resampling around the PWA maskable safe circle (radius 40%).
alpha = square.getchannel("A")
radius = max(math.hypot(x + .5 - side / 2, y + .5 - side / 2)
             for y in range(side) for x in range(side) if alpha.getpixel((x, y)))
scale = min(1, .38 * side / max(radius, 1))
for size in (192, 512):
    canvas = Image.new("RGBA", (size, size), "#fcfaf6")
    inner = max(1, int(size * scale))
    canvas.alpha_composite(square.resize((inner, inner), Image.Resampling.LANCZOS),
                           ((size - inner) // 2, (size - inner) // 2))
    canvas.convert("RGB").save(OUT / f"maskable-{size}-20261006.png")

apple = Image.new("RGBA", (180, 180), "#fcfaf6")
apple.alpha_composite(square.resize((180, 180), Image.Resampling.LANCZOS))
apple.convert("RGB").save(OUT / "apple-touch-icon-20261006.png")
square.save(OUT / "favicon-20261006.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print(f"Generated icons from {source.size}, maskable artwork scale={scale:.4f}")
