"""Una captura PNG a JPG de menos de 150 KB, bajando la calidad lo justo."""
import os, sys
from PIL import Image
entrada, salida = sys.argv[1:3]
im = Image.open(entrada).convert("RGB")
for q in (88, 84, 80, 76, 72):
    im.save(salida, "JPEG", quality=q, optimize=True)
    if os.path.getsize(salida) < 150_000: break
print(salida, os.path.getsize(salida), q)
