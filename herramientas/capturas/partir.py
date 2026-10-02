"""Dos capturas de la misma pantalla —de día y de noche— en una sola imagen,
partidas por una diagonal a 60°. A la izquierda el día, a la derecha la noche."""
import math, sys
from PIL import Image, ImageDraw
claro, oscuro, salida = sys.argv[1:4]
a, b = Image.open(claro).convert("RGB"), Image.open(oscuro).convert("RGB")
W, H = a.size; K = 3
dx = (H / 2) / math.tan(math.radians(60))
arriba, abajo = (W / 2 + dx) * K, (W / 2 - dx) * K
m = Image.new("L", (W * K, H * K), 0)
ImageDraw.Draw(m).polygon([(0, 0), (arriba, 0), (abajo, H * K), (0, H * K)], fill=255)
m = m.resize((W, H), Image.LANCZOS)
out = Image.composite(a, b, m)
raya = Image.new("RGBA", (W * K, H * K), (0, 0, 0, 0))
d = ImageDraw.Draw(raya)
d.line([(arriba, -K), (abajo, H * K + K)], fill=(16, 21, 29, 255), width=7 * K)
d.line([(arriba, -K), (abajo, H * K + K)], fill=(255, 255, 255, 255), width=3 * K)
raya = raya.resize((W, H), Image.LANCZOS)
out.paste(raya, (0, 0), raya)
for q in (88, 84, 80, 76, 72):
    out.save(salida, "JPEG", quality=q, optimize=True, progressive=False)
    import os
    if os.path.getsize(salida) < 150_000: break
print(salida, os.path.getsize(salida), q)
